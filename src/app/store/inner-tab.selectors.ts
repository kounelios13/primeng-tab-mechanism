import { createSelector } from '@ngrx/store';
import { innerTabFeature, InnerTabContextState } from './inner-tab.reducer';
import { InnerTabComponentType, InnerTabItem } from './inner-tab.actions';

/**
 * Base selector for inner tab contexts.
 */
export const selectInnerTabContexts = innerTabFeature.selectContexts;

/**
 * Factory selector to get inner tab context for a specific parent tab.
 */
export const selectInnerTabContext = (parentTabId: string) => createSelector(
  selectInnerTabContexts,
  (contexts): InnerTabContextState => 
    contexts[parentTabId] || { innerTabs: [], activeInnerTabId: null }
);

/**
 * Factory selector to get all inner tabs for a specific parent tab.
 */
export const selectInnerTabs = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.innerTabs
);

/**
 * Factory selector to get the active inner tab ID for a specific parent tab.
 */
export const selectActiveInnerTabId = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.activeInnerTabId
);

/**
 * Factory selector to get the active inner tab for a specific parent tab.
 */
export const selectActiveInnerTab = (parentTabId: string) => createSelector(
  selectInnerTabContext(parentTabId),
  (context) => context.innerTabs.find(tab => tab.id === context.activeInnerTabId)
);

/**
 * Factory selector to get a specific inner tab by ID within a parent context.
 */
export const selectInnerTabById = (parentTabId: string, tabId: string) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs) => tabs.find(tab => tab.id === tabId)
);

/**
 * Factory selector to get the count of inner tabs for a specific parent tab.
 */
export const selectInnerTabCount = (parentTabId: string) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs) => tabs.length
);

/**
 * Factory selector to get the index of the active inner tab.
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
 * Returns the first matching tab or undefined if not found.
 */
export const selectInnerTabByType = (parentTabId: string, componentType: InnerTabComponentType) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs): InnerTabItem | undefined => tabs.find(tab => tab.componentType === componentType)
);

/**
 * Factory selector to check if a tab of given component type exists within a parent context.
 */
export const selectIsTabTypeOpen = (parentTabId: string, componentType: InnerTabComponentType) => createSelector(
  selectInnerTabs(parentTabId),
  (tabs): boolean => tabs.some(tab => tab.componentType === componentType)
);
