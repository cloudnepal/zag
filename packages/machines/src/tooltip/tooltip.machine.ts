import { createMachine, ref } from "@ui-machines/core"
import { addDomEvent, addPointerEvent } from "tiny-dom-event"
import { noop } from "tiny-fn"
import { isElement, isSafari } from "tiny-guard"
import { proxy, subscribe } from "valtio"
import { uuid } from "../utils"

type Id = string | null

type Store = {
  id: Id
  prevId: Id
  setId: (val: Id) => void
}

export const tooltipStore = proxy<Store>({
  id: null,
  prevId: null,
  setId(val) {
    this.prevId = this.id
    this.id = val
  },
})

export type TooltipMachineContext = {
  doc?: Document
  id: string
  disabled?: boolean
  openDelay: number
  closeDelay: number
  closeOnPointerDown: boolean
}

export type TooltipMachineState = {
  value: "unknown" | "opening" | "open" | "closing" | "closed"
}

export const tooltipMachine = createMachine<TooltipMachineContext, TooltipMachineState>(
  {
    id: "tooltip",
    initial: "unknown",
    context: {
      id: uuid(),
      openDelay: 500,
      closeDelay: 500,
      closeOnPointerDown: true,
    },
    states: {
      unknown: {
        on: {
          SETUP: {
            target: "closed",
            actions: ["setOwnerDocument", "setId"],
          },
        },
      },

      closed: {
        entry: "clearGlobalId",
        on: {
          FOCUS: "open",
          POINTER_ENTER: [
            {
              cond: "noVisibleTooltip",
              target: "opening",
            },
            { target: "open" },
          ],
        },
      },

      opening: {
        after: {
          OPEN_DELAY: "open",
        },
        on: {
          POINTER_LEAVE: "closed",
          POINTER_DOWN: {
            cond: "closeOnPointerDown",
            target: "closed",
          },
        },
      },

      open: {
        activities: ["trackEscapeKey", "trackPointermoveForSafari"],
        entry: "setGlobalId",
        on: {
          POINTER_LEAVE: [
            {
              cond: "isVisible",
              target: "closing",
            },
            { target: "closed" },
          ],
          BLUR: "closing",
          ESCAPE: "closed",
          POINTER_DOWN: {
            cond: "closeOnPointerDown",
            target: "closed",
          },
          PRESS_ENTER: "closed",
        },
      },

      closing: {
        activities: "trackStore",
        after: {
          CLOSE_DELAY: "closed",
        },
        on: {
          FORCE_CLOSE: "closed",
        },
      },
    },
  },
  {
    activities: {
      trackStore(ctx, _evt, { send }) {
        return subscribe(tooltipStore, () => {
          if (tooltipStore.id !== ctx.id) {
            send("FORCE_CLOSE")
          }
        })
      },
      trackPointermoveForSafari(ctx, _evt, { send }) {
        if (!isSafari()) return noop
        const doc = ctx.doc ?? document
        return addPointerEvent(doc, "pointermove", (event) => {
          const selector = "[data-controls=tooltip][data-expanded]"
          if (isElement(event.target) && event.target.closest(selector)) return
          send("POINTER_LEAVE")
        })
      },
      trackEscapeKey(ctx, _evt, { send }) {
        const doc = ctx.doc ?? document
        return addDomEvent(doc, "keydown", (event) => {
          if (event.key === "Escape" || event.key === "Esc") {
            send("ESCAPE")
          }
        })
      },
    },
    actions: {
      setId(ctx, evt) {
        ctx.id = evt.id
      },
      setOwnerDocument(ctx, evt) {
        ctx.doc = ref(evt.doc)
      },
      setGlobalId(ctx) {
        tooltipStore.setId(ctx.id)
      },
      clearGlobalId(ctx) {
        if (ctx.id === tooltipStore.id) {
          tooltipStore.setId(null)
        }
      },
    },
    guards: {
      closeOnPointerDown: (ctx) => ctx.closeOnPointerDown,
      noVisibleTooltip: () => tooltipStore.id === null,
      isVisible: (ctx) => ctx.id === tooltipStore.id,
      isDisabled: (ctx) => !!ctx.disabled,
    },
    delays: {
      OPEN_DELAY: (ctx) => ctx.openDelay,
      CLOSE_DELAY: (ctx) => ctx.closeDelay,
    },
  },
)
