import { inject, Injector, Signal } from '@angular/core';
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
 * Abstract base class for tab wrapper/manager utilities.
 * Use this class to manage tabs from services or components that are not UI launchers.
 * 
 * This provides the same tab management functionality as BaseTabLauncher,
 * but without requiring a UI component. This enables the "wrapper mode" pattern
 * where tabs are managed and opened from any part of the application via the store.
 * 
 * Unlike BaseTabLauncher:
 * - Does not require a `componentType` property (no launcher tab)
 * - Can be instantiated as a service or used in any component
 * - Works in conjunction with InnerTabContainerComponent using direct componentRegistry
 * 
 * @template TComponentType - The enum type used for component types
 * 
 * @example As a service
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class ProjectTabManagerService extends BaseTabWrapper<InnerTabComponentType> {
 *   protected parentTabId = PARENT_TAB_IDS.PROJECTS;
 * 
 *   openProjectDetail(projectId: string, projectName: string): void {
 *     this.openInnerTab({
 *       id: `project-detail-${projectId}`,
 *       title: projectName,
 *       componentType: InnerTabComponentType.ProjectDetail,
 *       icon: 'pi pi-folder',
 *       closable: true,
 *       data: { projectId, projectName }
 *     });
 *   }
 * }
 * ```
 * 
 * @example In a component
 * ```typescript
 * export class MyComponent {
 *   private tabManager: ProjectTabManager;
 *   
 *   constructor() {
 *     this.tabManager = new ProjectTabManager();
 *   }
 *   
 *   openProject(project: Project): void {
 *     this.tabManager.openProjectDetail(project.id, project.name);
 *   }
 * }
 * ```
 */
export abstract class BaseTabWrapper<TComponentType extends string | number | undefined = InnerTabComponentType> {
  /**
   * The ID of the parent tab this wrapper manages.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  protected abstract parentTabId: ParentTabId;

  /**
   * NgRx Store instance, injected automatically.
   */
  protected store = inject(Store);

  /**
   * Injector instance for creating signals outside injection context.
   */
  private injector = inject(Injector);

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
        { initialValue: [], injector: this.injector }
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
  openInnerTab(config: InnerTabConfig): boolean {
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
    if (!this.canOpenTab(config.componentType as TComponentType, config as any)) {
      return false;
    }

    // Dispatch request action
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
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
  protected canOpenTab(componentType: TComponentType, config: InnerTabConfig): boolean {
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
  isTabTypeOpen(componentType: TComponentType): boolean {
    return this.currentTabs().some(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its component type.
   * 
   * @param componentType - The component type to find
   * @returns The tab item if found, undefined otherwise
   */
  findTabByType(componentType: TComponentType): InnerTabItem | undefined {
    return this.currentTabs().find(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its ID.
   * 
   * @param tabId - The tab ID to find
   * @returns The tab item if found, undefined otherwise
   */
  findTabById(tabId: string): InnerTabItem | undefined {
    return this.currentTabs().find(tab => tab.id === tabId);
  }

  /**
   * Focuses an existing tab by setting it as active.
   * Useful when trying to open a singleton that already exists.
   * 
   * @param tabId - The ID of the tab to focus
   */
  focusExistingTab(tabId: string): void {
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
  closeInnerTab(tabId: string): void {
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
  setActiveInnerTab(tabId: string): void {
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
  updateInnerTab(tabId: string, updates: Partial<InnerTabConfig>): void {
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
  generateTabId(prefix: string = 'tab'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Gets all current tabs for this parent context.
   * 
   * @returns Array of current inner tabs
   */
  getTabs(): InnerTabItem[] {
    return this.currentTabs();
  }

  /**
   * Gets the count of current tabs.
   * 
   * @returns Number of current tabs
   */
  getTabCount(): number {
    return this.currentTabs().length;
  }
}
