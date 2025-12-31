import { Component, Input, Type, inject, Signal, ChangeDetectionStrategy, effect, OnInit, EnvironmentInjector, createComponent } from '@angular/core';
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
 * Generic container component for inner tabs.
 * This component manages a set of inner tabs within a parent tab context.
 * Uses Angular Signals for reactive state management.
 * 
 * Now listens for pending tab requests via selector and dispatches add actions.
 * 
 * @example
 * ```html
 * <app-inner-tab-container
 *   [parentTabId]="PARENT_TAB_IDS.TASKS"
 *   [launcherComponent]="TaskLauncherComponent"
 *   [launcherComponentType]="InnerTabComponentType.TaskLauncher">
 * </app-inner-tab-container>
 * ```
 */
@Component({
  selector: 'app-inner-tab-container',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './inner-tab-container.component.html',
  styleUrl: './inner-tab-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
   */
  @Input({ required: true }) launcherComponent!: Type<BaseTabLauncher>;

  /**
   * Title for the launcher tab.
   */
  @Input() launcherTitle: string = 'Home';

  /**
   * Icon for the launcher tab.
   */
  @Input() launcherIcon: string = 'pi pi-home';

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

    // Create launcher instance to access its component registry
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
   * Initializes the inner tab context with the launcher tab.
   */
  private initializeContext(): void {
    const launcherTab: InnerTabItem = {
      id: `${this.parentTabId}-launcher`,
      parentTabId: this.parentTabId,
      title: this.launcherTitle,
      componentType: this.launcherInstance?.componentType ?? InnerTabComponentType.GenericLauncher,
      icon: this.launcherIcon,
      closable: false
    };

    this.store.dispatch(InnerTabActions.initContext({
      parentTabId: this.parentTabId,
      launcherTab
    }));
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
   */
  getComponent(tab: InnerTabItem): Type<unknown> | undefined {
    // Special case for launcher - use the provided component
    if (this.launcherInstance && tab.componentType === this.launcherInstance.componentType) {
      return this.launcherComponent;
    }
    // Get component from launcher's instance registry
    return this.launcherInstance?.componentRegistry.get(tab.componentType);
  }
}
