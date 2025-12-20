import { createActionGroup, emptyProps, props } from '@ngrx/store';

/**
 * Enum defining all available inner tab component types.
 * Add new component types here as you create new inner tab content components.
 */
export enum InnerTabComponentType {
  // Task-related inner tabs
  TaskLauncher = 'task-launcher',
  TaskDetail = 'task-detail',
  TaskForm = 'task-form',
  
  // Overview-related inner tabs
  OverviewLauncher = 'overview-launcher',
  OverviewChart = 'overview-chart',
  OverviewReport = 'overview-report',
  
  // Generic/shared inner tabs
  GenericLauncher = 'generic-launcher',
  Settings = 'settings'
}

/**
 * Interface for inner tab items that belong to a parent main tab.
 */
export interface InnerTabItem {
  id: string;
  parentTabId: string;
  title: string;
  componentType: InnerTabComponentType;
  icon?: string;
  closable: boolean;
  singleton?: boolean;  // If true, only one instance of this tab type can exist
  data?: Record<string, unknown>;
}

/**
 * Configuration for creating a new inner tab.
 * parentTabId is added automatically by the launcher.
 */
export type InnerTabConfig = Omit<InnerTabItem, 'parentTabId'>;

/**
 * Actions for managing inner tabs within parent tab contexts.
 */
export const InnerTabActions = createActionGroup({
  source: 'InnerTab',
  events: {
    // Initialize a context for a parent tab with its launcher tab
    'Init Context': props<{ parentTabId: string; launcherTab: InnerTabItem }>(),
    
    // Add a new inner tab to a parent context
    'Add Inner Tab': props<{ parentTabId: string; tab: InnerTabItem }>(),
    
    // Remove an inner tab from a parent context
    'Remove Inner Tab': props<{ parentTabId: string; tabId: string }>(),
    
    // Set the active inner tab within a parent context
    'Set Active Inner Tab': props<{ parentTabId: string; tabId: string }>(),
    
    // Update properties of an inner tab
    'Update Inner Tab': props<{ parentTabId: string; tabId: string; updates: Partial<InnerTabItem> }>(),
    
    // Clear all inner tabs for a parent (useful when parent tab is closed)
    'Clear Context': props<{ parentTabId: string }>(),
    
    // Clear all inner tab contexts
    'Clear All Contexts': emptyProps()
  }
});
