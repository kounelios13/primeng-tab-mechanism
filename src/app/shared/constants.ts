/**
 * Constants for parent tab identifiers.
 * 
 * Use these constants instead of hardcoded strings to ensure type safety
 * and easy refactoring. These IDs must match the tab IDs defined in
 * the main tab reducer's initial state.
 * 
 * @example
 * ```typescript
 * import { PARENT_TAB_IDS } from '../shared';
 * 
 * // Use in component
 * readonly parentTabId = PARENT_TAB_IDS.TASKS;
 * ```
 */
export const PARENT_TAB_IDS = {
  /** Tasks feature parent tab */
  TASKS: 'tasks',
  /** Overview feature parent tab */
  OVERVIEW: 'overview',
  /** Projects feature parent tab */
  PROJECTS: 'projects'
} as const;

/**
 * Type representing valid parent tab IDs.
 * 
 * Use this type for type-safe function parameters and return types.
 * 
 * @example
 * ```typescript
 * function getTabConfig(parentTabId: ParentTabId): TabConfig {
 *   // TypeScript will only allow 'tasks', 'overview', or 'projects'
 * }
 * ```
 */
export type ParentTabId = typeof PARENT_TAB_IDS[keyof typeof PARENT_TAB_IDS];

/**
 * Array of all parent tab IDs for iteration.
 * 
 * Useful when you need to perform operations on all parent tabs,
 * such as clearing all contexts or initializing all wrappers.
 * 
 * @example
 * ```typescript
 * ALL_PARENT_TAB_IDS.forEach(parentTabId => {
 *   store.dispatch(InnerTabActions.clearContext({ parentTabId }));
 * });
 * ```
 */
export const ALL_PARENT_TAB_IDS: ParentTabId[] = [
  PARENT_TAB_IDS.TASKS,
  PARENT_TAB_IDS.OVERVIEW,
  PARENT_TAB_IDS.PROJECTS
];
