import { inject, Injector, Signal, Type } from '@angular/core';
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
import { ComponentRegistry } from './inner-tab-container/inner-tab-container.component';

/**
 * Abstract base class for tab wrapper components.
 * Extend this class to create a wrapper that manages dynamic tabs without a launcher UI.
 * 
 * Each child class:
 * - Defines its own `parentTabId`
 * - Provides its own `componentRegistry` mapping component types to component classes
 * - Can implement custom methods to open specific tab types
 * 
 * This is similar to BaseTabLauncher but:
 * - Does not require a `componentType` property (no launcher tab)
 * - Includes a `componentRegistry` that can be passed to InnerTabContainerComponent
 * - Is designed for "wrapper mode" where tabs are managed without a launcher UI
 * 
 * @template TComponentType - The enum type used for component types
 * 
 * @example Creating a wrapper for Projects
 * ```typescript
 * export class ProjectTabWrapper extends BaseTabWrapper<InnerTabComponentType> {
 *   protected parentTabId = PARENT_TAB_IDS.PROJECTS;
 *   
 *   // Component registry for this wrapper - passed to InnerTabContainerComponent
 *   override componentRegistry: ComponentRegistry = new Map([
 *     [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
 *     [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
 *   ]);
 * 
 *   openProjectDetail(projectId: string, projectName: string): void {
 *     const tabId = `project-detail-${projectId}`;
 *     if (this.findTabById(tabId)) {
 *       this.focusExistingTab(tabId);
 *       return;
 *     }
 *     this.openInnerTab({
 *       id: tabId,
 *       title: projectName,
 *       componentType: InnerTabComponentType.ProjectDetail,
 *       icon: 'pi pi-folder',
 *       closable: true,
 *       data: { projectId, projectName }
 *     });
 *   }
 * 
 *   openProjectSettings(): void {
 *     this.openInnerTab({
 *       id: 'project-settings',
 *       title: 'Project Settings',
 *       componentType: InnerTabComponentType.ProjectSettings,
 *       icon: 'pi pi-cog',
 *       closable: true,
 *       singleton: true
 *     });
 *   }
 * }
 * ```
 * 
 * @example Using in a component
 * ```typescript
 * @Component({
 *   template: `
 *     <app-inner-tab-container
 *       [parentTabId]="wrapper.parentTabId"
 *       [componentRegistry]="wrapper.componentRegistry"
 *       [showLauncher]="false"
 *       [initialTabs]="initialTabs">
 *     </app-inner-tab-container>
 *     
 *     <button (click)="wrapper.openProjectDetail('1', 'My Project')">Open Project</button>
 *   `
 * })
 * export class ProjectsComponent {
 *   wrapper = new ProjectTabWrapper();
 *   initialTabs = [...];
 * }
 * ```
 */
export abstract class BaseTabWrapper<TComponentType extends string | number | undefined = InnerTabComponentType> {
  /**
   * The ID of the parent tab this wrapper manages.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  abstract readonly parentTabId: ParentTabId;

  /**
   * Component registry mapping component types to component classes.
   * Each child class should initialize this with their specific components.
   * This registry is passed to InnerTabContainerComponent for dynamic tab loading.
   * 
   * @example
   * ```typescript
   * componentRegistry: ComponentRegistry = new Map([
   *   [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
   *   [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
   * ]);
   * ```
   */
  abstract readonly componentRegistry: ComponentRegistry;

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
    if (!this.canOpenTab(config.componentType as TComponentType, config)) {
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
