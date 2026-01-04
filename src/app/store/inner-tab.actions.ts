import { createActionGroup, emptyProps, props } from '@ngrx/store';

/**
 * Enum defining all available inner tab component types.
 * 
 * Add new component types here as you create new inner tab content components.
 * Each component type should be unique and follow the naming convention:
 * `FeatureName` (PascalCase) for the key and `'feature-name'` (kebab-case) for the value.
 * 
 * @example
 * ```typescript
 * // Adding a new component type
 * export enum InnerTabComponentType {
 *   // ... existing types
 *   MyNewFeature = 'my-new-feature'
 * }
 * ```
 */
export enum InnerTabComponentType {
  // Task-related inner tabs
  /** Component for displaying task details */
  TaskDetail = 'task-detail',
  /** Component for creating or editing tasks */
  TaskForm = 'task-form',
  
  // Overview-related inner tabs
  /** Component for displaying chart visualizations */
  OverviewChart = 'overview-chart',
  /** Component for displaying reports and statistics */
  OverviewReport = 'overview-report',
  
  // Projects-related inner tabs
  /** Component for displaying project details */
  ProjectDetail = 'project-detail',
  /** Component for configuring project settings */
  ProjectSettings = 'project-settings',
  
  // Generic/shared inner tabs
  /** Generic settings component that can be used across features */
  Settings = 'settings'
}

/**
 * Interface for inner tab items that belong to a parent main tab.
 * 
 * Each inner tab must have a unique `id` within its parent context.
 * The `componentType` determines which component is rendered for the tab content.
 * 
 * @example
 * ```typescript
 * const tab: InnerTabItem = {
 *   id: 'task-detail-123',
 *   parentTabId: 'tasks',
 *   title: 'Task Details',
 *   componentType: InnerTabComponentType.TaskDetail,
 *   icon: 'pi pi-file',
 *   closable: true,
 *   data: { taskId: '123' }
 * };
 * ```
 */
export interface InnerTabItem {
  /** Unique identifier for this tab within its parent context */
  id: string;
  /** The ID of the parent main tab this inner tab belongs to */
  parentTabId: string;
  /** Display title shown on the tab header */
  title: string;
  /** 
   * The component type used to resolve the component class from the registry.
   * Can be a string, number, or undefined for flexibility with different enum types.
   */
  componentType: string | number | undefined;
  /** Optional PrimeIcons class for the tab icon (e.g., 'pi pi-file') */
  icon?: string;
  /** Whether the tab can be closed by the user */
  closable: boolean;
  /** If true, only one instance of this component type can exist at a time */
  singleton?: boolean;
  /** Optional data to pass to the inner tab component via @Input() tabData */
  data?: Record<string, unknown>;
}

/**
 * Configuration for creating a new inner tab.
 * 
 * This type is used when opening tabs from within a BaseTabWrapper.
 * The `parentTabId` is automatically added by the wrapper, so it's omitted here.
 * 
 * @example
 * ```typescript
 * const config: InnerTabConfig = {
 *   id: 'task-new-form',
 *   title: 'New Task',
 *   componentType: InnerTabComponentType.TaskForm,
 *   closable: true,
 *   singleton: true
 * };
 * ```
 */
export type InnerTabConfig = Omit<InnerTabItem, 'parentTabId'>;

/**
 * NgRx actions for managing inner tabs within parent tab contexts.
 * 
 * The inner tab system uses a request-based pattern:
 * 1. External components dispatch `requestAddInnerTab`
 * 2. The BaseTabWrapper observes pending requests
 * 3. The wrapper processes requests and dispatches `addInnerTab`
 * 
 * This decoupling allows any component to open tabs without direct
 * access to the wrapper component instance.
 */
export const InnerTabActions = createActionGroup({
  source: 'InnerTab',
  events: {
    /**
     * Initialize an empty context for a parent tab.
     * Called when a BaseTabWrapper component is initialized.
     */
    'Init Context': props<{ parentTabId: string }>(),
    
    /**
     * Request to add a new inner tab.
     * This action adds the tab to pendingRequests, which is then
     * processed by the BaseTabWrapper effect.
     */
    'Request Add Inner Tab': props<{ parentTabId: string; tab: InnerTabItem }>(),
    
    /**
     * Add a new inner tab to a parent context.
     * This action should be dispatched by BaseTabWrapper after
     * processing a pending request.
     */
    'Add Inner Tab': props<{ parentTabId: string; tab: InnerTabItem }>(),
    
    /**
     * Remove an inner tab from a parent context.
     * Automatically handles active tab selection after removal.
     */
    'Remove Inner Tab': props<{ parentTabId: string; tabId: string }>(),
    
    /**
     * Set the active inner tab within a parent context.
     * Used for tab switching and focusing existing tabs.
     */
    'Set Active Inner Tab': props<{ parentTabId: string; tabId: string }>(),
    
    /**
     * Update properties of an existing inner tab.
     * Useful for changing title, icon, or data after tab creation.
     */
    'Update Inner Tab': props<{ parentTabId: string; tabId: string; updates: Partial<InnerTabItem> }>(),
    
    /**
     * Clear all inner tabs for a specific parent tab.
     * Useful when a parent tab is closed or reset.
     */
    'Clear Context': props<{ parentTabId: string }>(),
    
    /**
     * Clear all inner tab contexts.
     * Resets the entire inner tab state to initial values.
     */
    'Clear All Contexts': emptyProps()
  }
});
