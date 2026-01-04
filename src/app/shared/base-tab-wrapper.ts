import { Component, inject, Signal, Type, OnInit, effect, EnvironmentInjector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { 
  InnerTabActions, 
  InnerTabConfig, 
  InnerTabComponentType,
  InnerTabItem,
  selectInnerTabs,
  selectActiveInnerTabId,
  selectPendingRequestsForParent,
  TabRequest
} from '../store';
import { ParentTabId } from './constants';

/**
 * Type for component registry - maps component type identifiers to component classes.
 */
export type ComponentRegistry = Map<string | number | undefined, Type<unknown>>;

/**
 * Abstract base component for tab wrappers.
 * Extend this component to create a wrapper that manages dynamic tabs without a launcher UI.
 * 
 * Each child class:
 * - Defines its own `parentTabId`
 * - Provides its own `componentRegistry` mapping component types to component classes
 * - Listens to store actions filtered by its `parentTabId`
 * - Dispatches actions through the store to open/close/manage tabs
 * 
 * The base class automatically:
 * - Listens for pending tab requests via the store
 * - Renders the tab container with dynamic tab loading
 * - Handles tab switching and closing
 * 
 * @template TComponentType - The enum type used for component types
 * 
 * @example Creating a wrapper for Projects
 * ```typescript
 * @Component({
 *   selector: 'app-projects',
 *   template: '',  // Uses base class template
 *   imports: [CommonModule]
 * })
 * export class ProjectsComponent extends BaseTabWrapper<InnerTabComponentType> {
 *   readonly parentTabId = PARENT_TAB_IDS.PROJECTS;
 *   
 *   readonly componentRegistry: ComponentRegistry = new Map([
 *     [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
 *     [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
 *   ]);
 * 
 *   readonly initialTabs: InnerTabItem[] = [
 *     { id: 'project-1', parentTabId: PARENT_TAB_IDS.PROJECTS, title: 'Project 1', ... }
 *   ];
 * 
 *   openProjectDetail(projectId: string, projectName: string): void {
 *     this.openInnerTab({
 *       id: `project-detail-${projectId}`,
 *       title: projectName,
 *       componentType: InnerTabComponentType.ProjectDetail,
 *       closable: true,
 *       data: { projectId, projectName }
 *     });
 *   }
 * }
 * ```
 */
@Component({
  selector: 'app-base-tab-wrapper',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  template: `
    <div class="inner-tab-container">
      @if (innerTabs().length > 0) {
        <p-tabs 
          [value]="activeTabId() ?? ''"
          (valueChange)="onTabValueChange($any($event))"
          styleClass="inner-tabs">
          
          <p-tablist>
            @for (tab of innerTabs(); track tab.id) {
              <p-tab [value]="tab.id" class="inner-tab-header">
                @if (tab.icon) {
                  <i [class]="tab.icon"></i>
                }
                <span class="tab-title">{{ tab.title }}</span>
                @if (tab.closable) {
                  <button 
                    class="close-button"
                    (click)="closeTab($event, tab.id)"
                    title="Close tab">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </p-tab>
            }
          </p-tablist>
          
          <p-tabpanels>
            @for (tab of innerTabs(); track tab.id) {
              <p-tabpanel [value]="tab.id">
                <div class="inner-tab-content">
                  @if (getComponent(tab); as component) {
                    <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id }"></ng-container>
                  } @else {
                    <div class="no-component-warning">
                      <i class="pi pi-exclamation-triangle"></i>
                      <p>Component not registered for type: {{ tab.componentType }}</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
  styles: [`
    .inner-tab-container {
      height: 100%;
    }

    .inner-tab-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab-title {
      margin: 0 0.25rem;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s, background-color 0.2s;
    }

    .close-button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .inner-tab-content {
      padding: 1rem;
    }

    .no-component-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #dc3545;
    }

    .no-component-warning i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export abstract class BaseTabWrapper<TComponentType extends string | number | undefined = InnerTabComponentType> implements OnInit {
  /**
   * The ID of the parent tab this wrapper manages.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  abstract readonly parentTabId: ParentTabId;

  /**
   * Component registry mapping component types to component classes.
   * Each child class should initialize this with their specific components.
   * 
   * @example
   * ```typescript
   * readonly componentRegistry: ComponentRegistry = new Map([
   *   [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
   *   [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
   * ]);
   * ```
   */
  abstract readonly componentRegistry: ComponentRegistry;

  /**
   * Initial tabs to open when the wrapper is initialized.
   * Override this in child classes to specify initial tabs.
   */
  readonly initialTabs: InnerTabItem[] = [];

  /**
   * NgRx Store instance, injected automatically.
   */
  protected store = inject(Store);

  /**
   * Environment injector for creating signals.
   */
  private environmentInjector = inject(EnvironmentInjector);

  /**
   * Signal containing inner tabs for this parent.
   */
  protected innerTabs!: Signal<InnerTabItem[]>;
  
  /**
   * Signal containing the active tab ID.
   */
  protected activeTabId!: Signal<string | null>;

  /**
   * Signal containing pending tab requests for this parent.
   */
  private pendingRequests!: Signal<TabRequest[]>;

  /**
   * Flag to track if context has been initialized.
   */
  private contextInitialized = false;

  /**
   * Set to track processed request identifiers to avoid duplicate processing.
   */
  private processedRequestIds = new Set<string>();

  constructor() {
    // Use effect to handle pending tab requests from the store
    effect(() => {
      if (this.pendingRequests) {
        const requests = this.pendingRequests();
        
        // Clean up processed IDs that are no longer in pending requests
        const currentRequestIds = new Set(
          requests.map(r => this.getRequestId(r))
        );
        
        const idsToDelete: string[] = [];
        this.processedRequestIds.forEach(id => {
          if (!currentRequestIds.has(id)) {
            idsToDelete.push(id);
          }
        });
        
        idsToDelete.forEach(id => this.processedRequestIds.delete(id));
        
        // Process each pending request that hasn't been processed yet
        requests.forEach(request => {
          const requestId = this.getRequestId(request);
          if (!this.processedRequestIds.has(requestId)) {
            this.processedRequestIds.add(requestId);
            this.handleTabRequest(request);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    // Initialize signals
    this.innerTabs = toSignal(
      this.store.select(selectInnerTabs(this.parentTabId)),
      { initialValue: [], injector: this.environmentInjector }
    );
    this.activeTabId = toSignal(
      this.store.select(selectActiveInnerTabId(this.parentTabId)),
      { initialValue: null, injector: this.environmentInjector }
    );
    this.pendingRequests = toSignal(
      this.store.select(selectPendingRequestsForParent(this.parentTabId)),
      { initialValue: [], injector: this.environmentInjector }
    );

    // Initialize context
    if (!this.contextInitialized && this.parentTabId) {
      this.initializeContext();
      this.contextInitialized = true;
    }
  }

  /**
   * Generates a unique identifier for a request to prevent duplicate processing.
   */
  private getRequestId(request: TabRequest): string {
    return `${request.parentTabId}-${request.tab.id}-${request.timestamp}`;
  }

  /**
   * Handles a pending tab request by dispatching the add action.
   */
  private handleTabRequest(request: TabRequest): void {
    this.store.dispatch(InnerTabActions.addInnerTab({
      parentTabId: request.parentTabId,
      tab: request.tab
    }));
  }

  /**
   * Initializes the inner tab context.
   */
  private initializeContext(): void {
    // Initialize context without launcher
    this.store.dispatch(InnerTabActions.initContext({
      parentTabId: this.parentTabId,
      launcherTab: null
    }));

    // Add initial tabs
    if (this.initialTabs.length > 0) {
      this.initialTabs.forEach(tab => {
        this.store.dispatch(InnerTabActions.addInnerTab({
          parentTabId: this.parentTabId,
          tab: {
            ...tab,
            parentTabId: this.parentTabId
          }
        }));
      });
    }
  }

  /**
   * Handles tab value change events from PrimeNG Tabs.
   */
  onTabValueChange(tabId: string): void {
    if (tabId && tabId !== this.activeTabId()) {
      this.store.dispatch(InnerTabActions.setActiveInnerTab({
        parentTabId: this.parentTabId,
        tabId
      }));
    }
  }

  /**
   * Closes a tab by its ID.
   */
  closeTab(event: Event, tabId: string): void {
    event.stopPropagation();
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Gets the component class for a given tab.
   */
  getComponent(tab: InnerTabItem): Type<unknown> | undefined {
    return this.componentRegistry.get(tab.componentType);
  }

  /**
   * Opens a new inner tab within the parent tab context.
   * Dispatches an action through the store.
   * 
   * @param config - Configuration for the new inner tab
   * @returns true if tab was opened, false if blocked
   */
  openInnerTab(config: InnerTabConfig): boolean {
    const tabs = this.innerTabs();
    
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

    // Dispatch request action through the store
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
   */
  protected canOpenTab(componentType: TComponentType, config: InnerTabConfig): boolean {
    return true;
  }

  /**
   * Checks if a tab of the given component type is currently open.
   */
  isTabTypeOpen(componentType: TComponentType): boolean {
    return this.innerTabs().some(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its component type.
   */
  findTabByType(componentType: TComponentType): InnerTabItem | undefined {
    return this.innerTabs().find(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its ID.
   */
  findTabById(tabId: string): InnerTabItem | undefined {
    return this.innerTabs().find(tab => tab.id === tabId);
  }

  /**
   * Focuses an existing tab by setting it as active.
   */
  focusExistingTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Closes an inner tab by its ID.
   */
  closeInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Sets the active inner tab.
   */
  setActiveInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Updates properties of an existing inner tab.
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
   */
  generateTabId(prefix: string = 'tab'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Gets all current tabs for this parent context.
   */
  getTabs(): InnerTabItem[] {
    return this.innerTabs();
  }

  /**
   * Gets the count of current tabs.
   */
  getTabCount(): number {
    return this.innerTabs().length;
  }
}
