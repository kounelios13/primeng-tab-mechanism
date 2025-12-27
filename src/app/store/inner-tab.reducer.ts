import { createFeature, createReducer, on } from '@ngrx/store';
import { InnerTabActions, InnerTabItem } from './inner-tab.actions';

/**
 * Represents a pending request to add a tab.
 */
export interface TabRequest {
  parentTabId: string;
  tab: InnerTabItem;
  timestamp: number;
}

/**
 * State for inner tabs within a single parent tab context.
 */
export interface InnerTabContextState {
  innerTabs: InnerTabItem[];
  activeInnerTabId: string | null;
}

/**
 * Root state for all inner tab contexts.
 * Each parent tab ID maps to its own inner tab state.
 */
export interface InnerTabState {
  contexts: Record<string, InnerTabContextState>;
  pendingRequests: TabRequest[];
}

/**
 * Initial state with no contexts.
 */
export const initialInnerTabState: InnerTabState = {
  contexts: {},
  pendingRequests: []
};

/**
 * Helper function to get or create a context for a parent tab.
 */
const getContext = (state: InnerTabState, parentTabId: string): InnerTabContextState => {
  return state.contexts[parentTabId] || { innerTabs: [], activeInnerTabId: null };
};

/**
 * Reducer for inner tab state management.
 */
const innerTabReducer = createReducer(
  initialInnerTabState,

  // Initialize a new context with a launcher tab
  on(InnerTabActions.initContext, (state, { parentTabId, launcherTab }) => ({
    ...state,
    contexts: {
      ...state.contexts,
      [parentTabId]: {
        innerTabs: [launcherTab],
        activeInnerTabId: launcherTab.id
      }
    }
  })),

  // Handle request to add inner tab - store it in pending requests
  on(InnerTabActions.requestAddInnerTab, (state, { parentTabId, tab }) => ({
    ...state,
    pendingRequests: [
      ...state.pendingRequests,
      { parentTabId, tab, timestamp: Date.now() }
    ]
  })),

  // Add a new inner tab to a context
  on(InnerTabActions.addInnerTab, (state, { parentTabId, tab }) => {
    const context = getContext(state, parentTabId);
    
    // Remove the corresponding request from pending requests
    const pendingRequests = state.pendingRequests.filter(
      req => !(req.parentTabId === parentTabId && req.tab.id === tab.id)
    );
    
    // Check if tab already exists, if so just activate it
    const existingTab = context.innerTabs.find(t => t.id === tab.id);
    if (existingTab) {
      return {
        ...state,
        pendingRequests,
        contexts: {
          ...state.contexts,
          [parentTabId]: {
            ...context,
            activeInnerTabId: tab.id
          }
        }
      };
    }

    return {
      ...state,
      pendingRequests,
      contexts: {
        ...state.contexts,
        [parentTabId]: {
          innerTabs: [...context.innerTabs, tab],
          activeInnerTabId: tab.id // Auto-activate new tab
        }
      }
    };
  }),

  // Remove an inner tab from a context
  on(InnerTabActions.removeInnerTab, (state, { parentTabId, tabId }) => {
    const context = getContext(state, parentTabId);
    const filteredTabs = context.innerTabs.filter(tab => tab.id !== tabId);
    
    // Determine new active tab if the removed tab was active
    let newActiveId = context.activeInnerTabId;
    if (context.activeInnerTabId === tabId) {
      // Find the previous tab or fallback to first tab
      const removedIndex = context.innerTabs.findIndex(tab => tab.id === tabId);
      const newIndex = Math.min(removedIndex, filteredTabs.length - 1);
      newActiveId = filteredTabs[newIndex]?.id || null;
    }

    return {
      ...state,
      contexts: {
        ...state.contexts,
        [parentTabId]: {
          innerTabs: filteredTabs,
          activeInnerTabId: newActiveId
        }
      }
    };
  }),

  // Set active inner tab
  on(InnerTabActions.setActiveInnerTab, (state, { parentTabId, tabId }) => {
    const context = getContext(state, parentTabId);
    return {
      ...state,
      contexts: {
        ...state.contexts,
        [parentTabId]: {
          ...context,
          activeInnerTabId: tabId
        }
      }
    };
  }),

  // Update an inner tab's properties
  on(InnerTabActions.updateInnerTab, (state, { parentTabId, tabId, updates }) => {
    const context = getContext(state, parentTabId);
    return {
      ...state,
      contexts: {
        ...state.contexts,
        [parentTabId]: {
          ...context,
          innerTabs: context.innerTabs.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          )
        }
      }
    };
  }),

  // Clear a specific context
  on(InnerTabActions.clearContext, (state, { parentTabId }) => {
    const { [parentTabId]: _, ...remainingContexts } = state.contexts;
    return {
      ...state,
      contexts: remainingContexts
    };
  }),

  // Clear all contexts
  on(InnerTabActions.clearAllContexts, () => initialInnerTabState)
);

/**
 * Feature definition for inner tabs.
 */
export const innerTabFeature = createFeature({
  name: 'innerTabs',
  reducer: innerTabReducer
});
