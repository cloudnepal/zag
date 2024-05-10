import type { StateMachine as S } from "@zag-js/core"
import type { CommonProperties, DirectionProperty, PropTypes, RequiredBy } from "@zag-js/types"

/* -----------------------------------------------------------------------------
 * Callback details
 * -----------------------------------------------------------------------------*/

export interface ValueChangeDetails {
  value: string
}

export interface FocusChangeDetails {
  focusedValue: string
}

/* -----------------------------------------------------------------------------
 * Machine context
 * -----------------------------------------------------------------------------*/

export interface IntlTranslations {
  listLabel?: string
}

export type ElementIds = Partial<{
  root: string
  trigger: string
  list: string
  content: string
  indicator: string
}>

interface PublicContext extends DirectionProperty, CommonProperties {
  /**
   * The ids of the elements in the tabs. Useful for composition.
   */
  ids?: ElementIds
  /**
   * Specifies the localized strings that identifies the accessibility elements and their states
   */
  translations?: IntlTranslations
  /**
   * Whether the keyboard navigation will loop from last tab to first, and vice versa.
   * @default true
   */
  loopFocus: boolean
  /**
   * The selected tab id
   */
  value: string | null
  /**
   * The orientation of the tabs. Can be `horizontal` or `vertical`
   * - `horizontal`: only left and right arrow key navigation will work.
   * - `vertical`: only up and down arrow key navigation will work.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical"
  /**
   * The activation mode of the tabs. Can be `manual` or `automatic`
   * - `manual`: Tabs are activated when clicked or press `enter` key.
   * - `automatic`: Tabs are activated when receiving focus
   *
   * @default "automatic"
   */
  activationMode?: "manual" | "automatic"
  /**
   * Callback to be called when the selected/active tab changes
   */
  onValueChange?: (details: ValueChangeDetails) => void
  /**
   * Callback to be called when the focused tab changes
   */
  onFocusChange?: (details: FocusChangeDetails) => void
}

export type UserDefinedContext = RequiredBy<PublicContext, "id">

type ComputedContext = Readonly<{}>

interface PrivateContext {
  /**
   * @internal
   * The focused tab id
   */
  focusedValue: string | null
  /**
   * @internal
   * Whether the indicator is rendered.
   */
  isIndicatorRendered: boolean
  /**
   * @internal
   * The active tab indicator's dom rect
   */
  indicatorRect?: Partial<{ left: string; top: string; width: string; height: string }>
  /**
   * @internal
   * Whether the active tab indicator's rect can transition
   */
  canIndicatorTransition?: boolean
  /**
   * @internal
   * Function to clean up the observer for the active tab's rect
   */
  indicatorCleanup?: VoidFunction | null
}

export interface MachineContext extends PublicContext, ComputedContext, PrivateContext {}

export interface MachineState {
  value: "idle" | "focused"
}

export type State = S.State<MachineContext, MachineState>

export type Send = S.Send<S.AnyEventObject>

/* -----------------------------------------------------------------------------
 * Component API
 * -----------------------------------------------------------------------------*/

export interface TriggerProps {
  /**
   * The value of the tab
   */
  value: string
  /**
   * Whether the tab is disabled
   */
  disabled?: boolean
}

export interface TriggerState {
  /**
   * Whether the tab is selected
   */
  selected: boolean
  /**
   * Whether the tab is focused
   */
  focused: boolean
  /**
   * Whether the tab is disabled
   */
  disabled: boolean
}

export interface ContentProps {
  /**
   * The value of the tab
   */
  value: string
}

export interface MachineApi<T extends PropTypes = PropTypes> {
  /**
   * The current value of the tabs.
   */
  value: string | null
  /**
   * The value of the tab that is currently focused.
   */
  focusedValue: string | null
  /**
   * Sets the value of the tabs.
   */
  setValue(value: string): void
  /**
   * Clears the value of the tabs.
   */
  clearValue(): void
  /**
   * Sets the indicator rect to the tab with the given value
   */
  setIndicatorRect(value: string): void
  /**
   * Returns the state of the trigger with the given props
   */
  getTriggerState(props: TriggerProps): TriggerState

  rootProps: T["element"]
  listProps: T["element"]
  getTriggerProps(props: TriggerProps): T["button"]
  getContentProps(props: ContentProps): T["element"]
  indicatorProps: T["element"]
}
