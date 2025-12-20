import { createFeature, createReducer, on } from '@ngrx/store';
import { TabActions, TabItem } from './tab.actions';

export interface TabState {
  tabs: TabItem[];
  activeTabId: string | null;
}

export const initialState: TabState = {
  tabs: [
    {
      id: 'tab1',
      title: 'Overview',
      content: 'Welcome to the PrimeNG Tab Mechanism demo!',
      icon: 'pi pi-home'
    },
    {
      id: 'tab2',
      title: 'Details',
      content: 'This tab contains detailed information.',
      icon: 'pi pi-info-circle'
    }
  ],
  activeTabId: 'tab1'
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