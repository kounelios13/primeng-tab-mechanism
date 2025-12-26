import { computed, Directive, inject, Input, Signal, Type } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { 
  InnerTabActions, 
  InnerTabConfig, 
  InnerTabComponentType,
  InnerTabItem,
  selectInnerTabs 
} from '../store';
import { ParentTabId } from './constants';

/**
 * Abstract base class for tab launcher components.
 * Extend this class in your launcher components to get access to
 * common inner tab management functionality.
 * 
 * Features:
 * - Signal-based tab state for reactive access
 * - Component registry management for dynamic tab loading
 * - canOpenTab() method that can be overridden for custom logic
 * - Automatic focus on existing tab when singleton is opened
 * 
 * @example
 * ```typescript
 * export class TaskLauncherComponent extends BaseTabLauncher {
 *   protected parentTabId = PARENT_TAB_IDS.TASKS;
 * 
 *   // Initialize component registry for this launcher
 *   protected componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
 *     [InnerTabComponentType.TaskDetail, TaskDetailComponent],
 *     [InnerTabComponentType.TaskForm, TaskFormComponent]
 *   ]);
 * 
 *   openNewTaskForm(): void {
 *     this.openInnerTab({
 *       id: this.generateTabId('task-new'),
 *       title: 'New Task',
 *       componentType: InnerTabComponentType.TaskForm,
 *       icon: 'pi pi-plus',
 *       closable: true,
 *       singleton: true  // Only one instance allowed
 *     });
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseTabLauncher {
  /**
   * The ID of the parent tab this launcher belongs to.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  protected abstract parentTabId: ParentTabId;

  /**
   * Component registry mapping InnerTabComponentType to component classes.
   * Each child class should initialize this with their specific components.
   * This can be used in templates to iterate over available components.
   * 
   * @example
   * ```typescript
   * componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
   *   [InnerTabComponentType.TaskDetail, TaskDetailComponent],
   *   [InnerTabComponentType.TaskForm, TaskFormComponent]
   * ]);
   * ```
   */
  componentRegistry: Map<InnerTabComponentType, Type<unknown>> = new Map();

  /**
   * Data passed from the inner tab system via ngComponentOutlet.
   * Available for launchers that need initialization data.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this tab, passed from the inner tab system.
   */
  @Input() tabId?: string;

  /**
   * NgRx Store instance, injected automatically.
   */
  protected store = inject(Store);

  /**
   * Signal containing current inner tabs from store.
   * Automatically updates when store changes.
   * Note: Initialized lazily in getter due to abstract parentTabId.
   */
  private _currentTabs?: Signal<InnerTabItem[]>;

  protected get currentTabs(): Signal<InnerTabItem[]> {
    if (!this._currentTabs) {
      this._currentTabs = toSignal(
        this.store.select(selectInnerTabs(this.parentTabId)), 
        { initialValue: [] }
      );
    }
    return this._currentTabs;
  }

  /**
   * Opens a new inner tab within the parent tab context.
   * If the tab is marked as singleton and already exists, focuses the existing tab.
   * Uses canOpenTab() for additional custom validation.
   * 
   * @param config - Configuration for the new inner tab
   * @returns true if tab was opened, false if blocked (singleton exists or canOpenTab returned false)
   */
  protected openInnerTab(config: InnerTabConfig): boolean {
    const tabs = this.currentTabs();
    
    // Check if singleton and already exists
    if (config.singleton) {
      const existingTab = tabs.find(tab => tab.componentType === config.componentType);
      if (existingTab) {    
        this.focusExistingTab(existingTab.id);
        return false;
      }
    }

    // Check custom validation
    if (!this.canOpenTab(config.componentType, config)) {
      return false;
    }

    this.store.dispatch(InnerTabActions.addInnerTab({
      parentTabId: this.parentTabId,
      tab: {
        ...config,
        parentTabId: this.parentTabId
      }
    }));

    return true;
  }

  /**
   * Determines if a tab of the given type can be opened.
   * Override this method in subclasses for custom validation logic.
   * 
   * @param componentType - The type of component to open
   * @param config - The full tab configuration
   * @returns true if the tab can be opened, false otherwise
   */
  protected canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    // Default implementation: always allow
    // Subclasses can override for custom logic
    return true;
  }

  /**
   * Checks if a tab of the given component type is currently open.
   * 
   * @param componentType - The component type to check
   * @returns true if a tab of this type exists
   */
  protected isTabTypeOpen(componentType: InnerTabComponentType): boolean {
    return this.currentTabs().some(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its component type.
   * 
   * @param componentType - The component type to find
   * @returns The tab item if found, undefined otherwise
   */
  protected findTabByType(componentType: InnerTabComponentType): InnerTabItem | undefined {
    return this.currentTabs().find(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its ID.
   * 
   * @param tabId - The tab ID to find
   * @returns The tab item if found, undefined otherwise
   */
  protected findTabById(tabId: string): InnerTabItem | undefined {
    return this.currentTabs().find(tab => tab.id === tabId);
  }

  /**
   * Focuses an existing tab by setting it as active.
   * Useful when trying to open a singleton that already exists.
   * 
   * @param tabId - The ID of the tab to focus
   */
  protected focusExistingTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Closes an inner tab by its ID.
   * 
   * @param tabId - The ID of the tab to close
   */
  protected closeInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Sets the active inner tab.
   * 
   * @param tabId - The ID of the tab to activate
   */
  protected setActiveInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Updates properties of an existing inner tab.
   * 
   * @param tabId - The ID of the tab to update
   * @param updates - Partial properties to update
   */
  protected updateInnerTab(tabId: string, updates: Partial<InnerTabConfig>): void {
    this.store.dispatch(InnerTabActions.updateInnerTab({
      parentTabId: this.parentTabId,
      tabId,
      updates
    }));
  }

  /**
   * Generates a unique tab ID with an optional prefix.
   * 
   * @param prefix - Optional prefix for the ID
   * @returns A unique string ID
   */
  protected generateTabId(prefix: string = 'tab'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
