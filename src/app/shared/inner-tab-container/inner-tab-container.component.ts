import { Component, Input, Type, inject, Signal, effect, OnInit, EnvironmentInjector, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { 
  InnerTabItem, 
  InnerTabActions, 
  InnerTabComponentType,
  selectInnerTabs,
  selectActiveInnerTabId,
  selectPendingRequestsForParent,
  TabRequest
} from '../../store';
import { ParentTabId } from '../constants';
import { BaseTabLauncher } from '../base-tab-launcher';

/**
 * Type for component registry - maps component type identifiers to component classes.
 */
export type ComponentRegistry = Map<string | number | undefined, Type<unknown>>;

/**
 * Generic container component for inner tabs.
 * This component manages a set of inner tabs within a parent tab context.
 * Uses Angular Signals for reactive state management.
 * 
 * Listens for pending tab requests via selector and dispatches add actions.
 * 
 * Supports two modes of operation:
 * 1. **With launcher component** (traditional): Provide a `launcherComponent` that extends `BaseTabLauncher`.
 *    The component registry is derived from the launcher instance.
 * 2. **Without launcher (wrapper mode)**: Provide a `componentRegistry` directly and set `showLauncher="false"`.
 *    This allows dynamic tabs to be rendered automatically without a launcher component.
 * 
 * @example Basic usage with launcher
 * ```html
 * <app-inner-tab-container
 *   [parentTabId]="PARENT_TAB_IDS.TASKS"
 *   [launcherComponent]="TaskLauncherComponent"
 *   [launcherTitle]="'Task Home'"
 *   [launcherIcon]="'pi pi-home'">
 * </app-inner-tab-container>
 * ```
 * 
 * @example Without launcher, with component registry (wrapper mode)
 * ```html
 * <app-inner-tab-container
 *   [parentTabId]="PARENT_TAB_IDS.PROJECTS"
 *   [componentRegistry]="projectComponentRegistry"
 *   [showLauncher]="false"
 *   [initialTabs]="initialProjectTabs">
 * </app-inner-tab-container>
 * ```
 * 
 * @example With both launcher and initial tabs
 * ```html
 * <app-inner-tab-container
 *   [parentTabId]="PARENT_TAB_IDS.OVERVIEW"
 *   [launcherComponent]="OverviewLauncherComponent"
 *   [launcherTitle]="'Dashboard'"
 *   [showLauncher]="true"
 *   [initialTabs]="initialCharts">
 * </app-inner-tab-container>
 * ```
 */
@Component({
  selector: 'app-inner-tab-container',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './inner-tab-container.component.html',
  styleUrl: './inner-tab-container.component.scss'
})
export class InnerTabContainerComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly environmentInjector = inject(EnvironmentInjector);

  /**
   * The ID of the parent tab this container belongs to.
   */
  @Input({ required: true }) parentTabId!: ParentTabId;

  /**
   * The component class to use for the launcher tab.
   * Must extend BaseTabLauncher.
   * 
   * Either `launcherComponent` or `componentRegistry` must be provided.
   * If both are provided, the launcher's registry takes precedence for launcher-related components,
   * but the direct `componentRegistry` can be used to supplement additional component mappings.
   */
  @Input() launcherComponent?: Type<BaseTabLauncher>;

  /**
   * Direct component registry for mapping component types to component classes.
   * Use this when you want to render dynamic tabs without a launcher component.
   * 
   * Either `launcherComponent` or `componentRegistry` must be provided.
   * When both are provided, lookups first check the launcher's registry, then fall back to this registry.
   * 
   * @example
   * ```typescript
   * componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
   *   [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
   *   [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
   * ]);
   * ```
   */
  @Input() componentRegistry?: ComponentRegistry;

  /**
   * Title for the launcher tab.
   */
  @Input() launcherTitle: string = 'Home';

  /**
   * Icon for the launcher tab.
   */
  @Input() launcherIcon: string = 'pi pi-home';

  /**
   * Whether to show the launcher as a tab.
   * If false, the launcher will not be added as a tab.
   * Default: true (but automatically set to false if no launcherComponent is provided)
   */
  @Input() showLauncher: boolean = true;

  /**
   * Initial tabs to open when the container is initialized.
   * These tabs will be opened automatically after initialization.
   * When using wrapper mode (without launcher), this is the primary way to add initial tabs.
   */
  @Input() initialTabs: InnerTabItem[] = [];

  /**
   * Reference to the launcher component instance for accessing its registry.
   */
  private launcherInstance?: BaseTabLauncher;

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
   * Set to track processed request identifiers (parentTabId-tabId-timestamp) to avoid duplicate processing.
   * Automatically cleaned up as requests are removed from the store.
   */
  private processedRequestIds = new Set<string>();

  ngOnInit(): void {
    // Validate configuration - either launcherComponent or componentRegistry must be provided
    if (!this.launcherComponent && !this.componentRegistry) {
      console.error('InnerTabContainerComponent: Either launcherComponent or componentRegistry must be provided.');
    }

    // If no launcher component is provided, automatically disable showLauncher
    if (!this.launcherComponent) {
      this.showLauncher = false;
    }

    // Initialize signals with injector option
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

    // Create launcher instance to access its component registry (only if launcher is provided)
    if (this.launcherComponent && !this.launcherInstance) {
      const componentRef = createComponent(this.launcherComponent, {
        environmentInjector: this.environmentInjector
      });
      this.launcherInstance = componentRef.instance as BaseTabLauncher;
    }

    // Initialize context
    if (!this.contextInitialized && this.parentTabId) {
      this.initializeContext();
      this.contextInitialized = true;
    }
  }

  constructor() {
    // Use effect to handle pending tab requests
    effect(() => {
      // Access the signal to establish dependency (only after ngOnInit)
      if (this.pendingRequests) {
        const requests = this.pendingRequests();
        
        // Clean up processed IDs that are no longer in pending requests
        const currentRequestIds = new Set(
          requests.map(r => this.getRequestId(r))
        );
        
        // Collect IDs to delete (safer than modifying while iterating)
        const idsToDelete: string[] = [];
        this.processedRequestIds.forEach(id => {
          if (!currentRequestIds.has(id)) {
            idsToDelete.push(id);
          }
        });
        
        // Remove collected IDs
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

  /**
   * Generates a unique identifier for a request to prevent duplicate processing.
   * Uses parentTabId and tab.id to uniquely identify the request.
   * The timestamp is included to handle edge cases where the same tab might be
   * requested multiple times intentionally (e.g., close and reopen).
   */
  private getRequestId(request: TabRequest): string {
    return `${request.parentTabId}-${request.tab.id}-${request.timestamp}`;
  }

  /**
   * Handles a pending tab request by dispatching the add action.
   * The request will be removed from the pending list by the reducer.
   */
  private handleTabRequest(request: TabRequest): void {
    this.store.dispatch(InnerTabActions.addInnerTab({
      parentTabId: request.parentTabId,
      tab: request.tab
    }));
  }

  /**
   * Initializes the inner tab context with the launcher tab (if showLauncher is true)
   * and any initial tabs.
   */
  private initializeContext(): void {
    // Only show warning if launcher is expected but not available
    if (this.showLauncher && !this.launcherInstance?.componentType) {
      console.error('Launcher instance or componentType not found. Ensure launcher extends BaseTabLauncher and sets componentType.');
    }

    // Create launcher tab or null if showLauncher is false or no launcher provided
    const launcherTab: InnerTabItem | null = (this.showLauncher && this.launcherInstance) ? {
      id: `${this.parentTabId}-launcher`,
      parentTabId: this.parentTabId,
      title: this.launcherTitle,
      componentType: this.launcherInstance.componentType ?? InnerTabComponentType.GenericLauncher,
      icon: this.launcherIcon,
      closable: false
    } : null;

    // Dispatch init context with launcher (or null)
    this.store.dispatch(InnerTabActions.initContext({
      parentTabId: this.parentTabId,
      launcherTab
    }));

    // If there are initial tabs, add them after initialization
    if (this.initialTabs.length > 0) {
      this.initialTabs.forEach(tab => {
        this.store.dispatch(InnerTabActions.addInnerTab({
          parentTabId: this.parentTabId,
          tab: {
            ...tab,
            // Override parentTabId to ensure it matches the container's parentTabId
            // This guards against mismatches and ensures type compliance with InnerTabItem
            parentTabId: this.parentTabId
          }
        }));
      });
    }
  }

  /**
   * Handles tab value change events from PrimeNG Tabs.
   * The value is the tab ID string.
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
   * Looks up the component in the following order:
   * 1. If launcher is provided and tab type matches launcher, return the launcher component
   * 2. Check the launcher's component registry
   * 3. Check the direct componentRegistry input
   */
  getComponent(tab: InnerTabItem): Type<unknown> | undefined {
    // Special case for launcher - use the provided launcher component
    if (this.launcherInstance && this.launcherComponent && tab.componentType === this.launcherInstance.componentType) {
      return this.launcherComponent;
    }
    
    // First check launcher's registry (if available)
    const fromLauncher = this.launcherInstance?.componentRegistry.get(tab.componentType as any);
    if (fromLauncher) {
      return fromLauncher;
    }
    
    // Fall back to direct componentRegistry input
    return this.componentRegistry?.get(tab.componentType);
  }
}
