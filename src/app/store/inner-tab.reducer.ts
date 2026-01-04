import { createFeature, createReducer, on } from '@ngrx/store';
import { InnerTabActions, InnerTabItem } from './inner-tab.actions';

/**
 * Represents a pending request to add a tab.
 * 
 * Pending requests are stored in the state and processed by BaseTabWrapper.
 * The timestamp is used to generate unique identifiers for deduplication.
 */
export interface TabRequest {
  /** The parent tab context where the new tab should be added */
  parentTabId: string;
  /** The complete tab configuration to add */
  tab: InnerTabItem;
  /** Timestamp when the request was created (for deduplication) */
  timestamp: number;
}

/**
 * State for inner tabs within a single parent tab context.
 * 
 * Each parent tab has its own context containing its inner tabs
 * and the currently active inner tab.
 */
export interface InnerTabContextState {
  /** Array of inner tabs in this context */
  innerTabs: InnerTabItem[];
  /** ID of the currently active inner tab, or null if none */
  activeInnerTabId: string | null;
}

/**
 * Root state for all inner tab contexts.
 * 
 * The state is organized as a map of parent tab IDs to their contexts,
 * plus a list of pending tab requests waiting to be processed.
 */
export interface InnerTabState {
  /** Map of parent tab IDs to their inner tab contexts */
  contexts: Record<string, InnerTabContextState>;
  /** Queue of pending tab addition requests */
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

  // Initialize a new context (empty initially)
  on(InnerTabActions.initContext, (state, { parentTabId }) => ({
    ...state,
    contexts: {
      ...state.contexts,
      [parentTabId]: {
        innerTabs: [],
        activeInnerTabId: null
      }
    }
  })),

  // Handle request to add inner tab - store it in pending requests
  // Deduplicates based on parentTabId and tab.id to prevent duplicates
  on(InnerTabActions.requestAddInnerTab, (state, { parentTabId, tab }) => {
    // Check if this exact tab request already exists
    const isDuplicate = state.pendingRequests.some(
      req => req.parentTabId === parentTabId && req.tab.id === tab.id
    );
    
    // Only add if not already pending
    if (isDuplicate) {
      return state;
    }
    
    return {
      ...state,
      pendingRequests: [
        ...state.pendingRequests,
        { parentTabId, tab, timestamp: Date.now() }
      ]
    };
  }),

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
