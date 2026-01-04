import { createSelector } from '@ngrx/store';
import { tabFeature } from './tab.reducer';

/**
 * Selectors for accessing main tab state.
 * 
 * @example
 * ```typescript
 * // In a component using signals
 * readonly tabs = toSignal(
 *   this.store.select(selectAllTabs),
 *   { initialValue: [] }
 * );
 * ```
 */

/**
 * Select all main tabs from the store.
 * Returns an array of TabItem objects.
 */
export const selectAllTabs = tabFeature.selectTabs;

/**
 * Select the active main tab ID.
 * Returns the ID string or null if no tab is active.
 */
export const selectActiveTabId = tabFeature.selectActiveTabId;

/**
 * Select the currently active main tab item.
 * Returns the full TabItem object or undefined if no tab is active.
 */
export const selectActiveTab = createSelector(
  selectAllTabs,
  selectActiveTabId,
  (tabs, activeTabId) => tabs.find(tab => tab.id === activeTabId)
);

/**
 * Factory selector to find a specific main tab by its ID.
 * 
 * @param id - The tab ID to search for
 * @returns Selector that returns the TabItem or undefined
 */
export const selectTabById = (id: string) => createSelector(
  selectAllTabs,
  (tabs) => tabs.find(tab => tab.id === id)
);