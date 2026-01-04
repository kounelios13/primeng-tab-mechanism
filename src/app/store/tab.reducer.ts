import { createFeature, createReducer, on } from '@ngrx/store';
import { TabActions, TabItem } from './tab.actions';

/**
 * State interface for the main tab panel.
 */
export interface TabState {
  /** Array of all main tabs */
  tabs: TabItem[];
  /** ID of the currently active main tab, or null if none */
  activeTabId: string | null;
}

/**
 * Initial state with default main tabs.
 * 
 * These tab IDs MUST match the values in PARENT_TAB_IDS constants
 * to ensure proper routing of inner tab actions.
 * 
 * @see PARENT_TAB_IDS in shared/constants.ts
 */
export const initialState: TabState = {
  tabs: [
    {
      id: 'tasks',
      title: 'Tasks',
      content: 'Manage your tasks here',
      icon: 'pi pi-check-square'
    },
    {
      id: 'overview',
      title: 'Overview',
      content: 'View project overview and summary',
      icon: 'pi pi-chart-bar'
    },
    {
      id: 'projects',
      title: 'Projects',
      content: 'Manage your projects',
      icon: 'pi pi-folder'
    }
  ],
  activeTabId: 'tasks'
};

const tabReducer = createReducer(
  initialState,
  on(TabActions.addTab, (state, { tab }) => ({
    ...state,
    tabs: [...state.tabs, tab]
  })),
  on(TabActions.removeTab, (state, { id }) => ({
    ...state,
    tabs: state.tabs.filter(tab => tab.id !== id),
    activeTabId: state.activeTabId === id ? 
      (state.tabs.length > 1 ? state.tabs.find(tab => tab.id !== id)?.id || null : null) : 
      state.activeTabId
  })),
  on(TabActions.setActiveTab, (state, { id }) => ({
    ...state,
    activeTabId: id
  })),
  on(TabActions.updateTab, (state, { id, updates }) => ({
    ...state,
    tabs: state.tabs.map(tab => 
      tab.id === id ? { ...tab, ...updates } : tab
    )
  }))
);

export const tabFeature = createFeature({
  name: 'tabs',
  reducer: tabReducer
});