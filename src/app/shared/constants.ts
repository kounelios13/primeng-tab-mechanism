/**
 * Constants for parent tab identifiers.
 * Use these instead of hardcoded strings to ensure type safety.
 */
export const PARENT_TAB_IDS = {
  TASKS: 'tasks',
  OVERVIEW: 'overview',
  PROJECTS: 'projects'
} as const;

/**
 * Type representing valid parent tab IDs.
 */
export type ParentTabId = typeof PARENT_TAB_IDS[keyof typeof PARENT_TAB_IDS];

/**
 * Array of all parent tab IDs for iteration.
 */
export const ALL_PARENT_TAB_IDS: ParentTabId[] = [
  PARENT_TAB_IDS.TASKS,
  PARENT_TAB_IDS.OVERVIEW,
  PARENT_TAB_IDS.PROJECTS
];
