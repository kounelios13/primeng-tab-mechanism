import { createSelector } from '@ngrx/store';
import { innerTabFeature, InnerTabContextState } from './inner-tab.reducer';
import { InnerTabItem } from './inner-tab.actions';

/**
 * Selectors for accessing inner tab state.
 * 
 * These selectors are factory functions that take a `parentTabId` parameter
 * to scope the selection to a specific parent tab context.
 * 
 * @example
 * ```typescript
 * // In a component using signals
 * readonly tabs = toSignal(
 *   this.store.select(selectInnerTabs(PARENT_TAB_IDS.TASKS)),
 *   { initialValue: [] }
 * );
 * ```
 */

/**
 * Base selector for all inner tab contexts.
 * Returns the entire contexts map from the inner tab state.
 */
export const selectInnerTabContexts = innerTabFeature.selectContexts;

/**
 * Selector for all pending tab requests.
 * Returns the array of pending requests waiting to be processed.
 */
export const selectPendingRequests = innerTabFeature.selectPendingRequests;

/**
 * Factory selector to get pending requests for a specific parent tab.
 * 
 * @param parentTabId - The parent tab ID to filter requests for
 * @returns Selector that returns filtered pending requests
 */
export const selectPendingRequestsForParent = (parentTabId: string) => createSelector(
  selectPendingRequests,
  (requests) => requests.filter(req => req.parentTabId === parentTabId)
);

/**
 * Factory selector to get the inner tab context for a specific parent tab.
 * Returns a default empty context if the parent tab hasn't been initialized.
 * 
 * @param parentTabId - The parent tab ID to get context for
 * @returns Selector that returns the InnerTabContextState
 */
export const selectInnerTabContext = (parentTabId: string) => createSelector(
  selectInnerTabContexts,
  (contexts): InnerTabContextState => 
    contexts[parentTabId] || { innerTabs: [], activeInnerTabId: null }
);

/**
 * Factory selector to get all inner tabs for a specific parent tab.
 * 
 * @param parentTabId - The parent tab ID to get tabs for
 * @returns Selector that returns an array of InnerTabItem
 */
export const selectInnerTabs = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.innerTabs
);

/**
 * Factory selector to get the active inner tab ID for a specific parent tab.
 * 
 * @param parentTabId - The parent tab ID to get active tab for
 * @returns Selector that returns the active tab ID or null
 */
export const selectActiveInnerTabId = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.activeInnerTabId
);

/**
 * Factory selector to get the active inner tab item for a specific parent tab.
 * Returns the full InnerTabItem object, or undefined if no tab is active.
 * 
 * @param parentTabId - The parent tab ID to get active tab for
 * @returns Selector that returns the active InnerTabItem or undefined
 */
export const selectActiveInnerTab = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.innerTabs.find(tab => tab.id === context.activeInnerTabId)
);

/**
 * Factory selector to get a specific inner tab by its ID within a parent context.
 * 
 * @param parentTabId - The parent tab ID containing the tab
 * @param tabId - The ID of the tab to find
 * @returns Selector that returns the InnerTabItem or undefined
 */
export const selectInnerTabById = (parentTabId: string, tabId: string) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs) => tabs.find(tab => tab.id === tabId)
);

/**
 * Factory selector to get the count of inner tabs for a specific parent tab.
 * 
 * @param parentTabId - The parent tab ID to count tabs for
 * @returns Selector that returns the number of tabs
 */
export const selectInnerTabCount = (parentTabId: string) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs) => tabs.length
);

/**
 * Factory selector to get the index of the active inner tab.
 * Returns 0 if no active tab is found (safe default for UI).
 * 
 * @param parentTabId - The parent tab ID to get active index for
 * @returns Selector that returns the zero-based index
 */
export const selectActiveInnerTabIndex = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => {
    const index = context.innerTabs.findIndex(tab => tab.id === context.activeInnerTabId);
    return index >= 0 ? index : 0;
  }
);

/**
 * Factory selector to find a tab by its component type within a parent context.
 * Returns the first matching tab. Useful for singleton tab patterns.
 * 
 * @param parentTabId - The parent tab ID to search in
 * @param componentType - The component type to search for
 * @returns Selector that returns the first matching InnerTabItem or undefined
 */
export const selectInnerTabByType = (parentTabId: string, componentType: string | number | undefined) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs): InnerTabItem | undefined => tabs.find(tab => tab.componentType === componentType)
);

/**
 * Factory selector to check if a tab of the given component type exists.
 * Useful for enabling/disabling buttons based on whether a singleton tab is open.
 * 
 * @param parentTabId - The parent tab ID to check in
 * @param componentType - The component type to check for
 * @returns Selector that returns true if a tab of that type exists
 */
export const selectIsTabTypeOpen = (parentTabId: string, componentType: string | number | undefined) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs): boolean => tabs.some(tab => tab.componentType === componentType)
);
