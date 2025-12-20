import { createSelector } from '@ngrx/store';
import { tabFeature } from './tab.reducer';

// Use feature selectors from createFeature
export const selectAllTabs = tabFeature.selectTabs;
export const selectActiveTabId = tabFeature.selectActiveTabId;

// Custom selectors
export const selectActiveTab = createSelector(
  selectAllTabs,
  selectActiveTabId,
  (tabs, activeTabId) => tabs.find(tab => tab.id === activeTabId)
);

export const selectTabById = (id: string) => createSelector(
  selectAllTabs,
  (tabs) => tabs.find(tab => tab.id === id)
);