import { createActionGroup, props } from '@ngrx/store';

/**
 * Interface for main tab items in the top-level tab panel.
 * 
 * Main tabs represent the primary navigation sections of the application.
 * Each main tab can contain inner tabs managed by a BaseTabWrapper component.
 * 
 * @example
 * ```typescript
 * const tab: TabItem = {
 *   id: 'tasks',
 *   title: 'Tasks',
 *   content: 'Manage your tasks',
 *   icon: 'pi pi-check-square',
 *   closable: false
 * };
 * ```
 */
export interface TabItem {
  /** Unique identifier for this tab (should match PARENT_TAB_IDS) */
  id: string;
  /** Display title shown on the tab header */
  title: string;
  /** Default content or description (used when no component is mapped) */
  content: string;
  /** Optional PrimeIcons class for the tab icon */
  icon?: string;
  /** Whether the tab is disabled (cannot be selected) */
  disabled?: boolean;
  /** Whether the tab can be closed by the user */
  closable?: boolean;
}

/**
 * NgRx actions for managing main tabs.
 * 
 * These actions control the top-level tab panel, including
 * adding, removing, and switching between main tabs.
 */
export const TabActions = createActionGroup({
  source: 'Tab',
  events: {
    /** Add a new main tab to the tab panel */
    'Add Tab': props<{ tab: TabItem }>(),
    /** Remove a main tab by its ID */
    'Remove Tab': props<{ id: string }>(),
    /** Set the active (selected) main tab */
    'Set Active Tab': props<{ id: string }>(),
    /** Update properties of an existing main tab */
    'Update Tab': props<{ id: string; updates: Partial<TabItem> }>()
  }
});