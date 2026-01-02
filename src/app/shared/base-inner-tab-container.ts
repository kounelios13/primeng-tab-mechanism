import { Directive, Input, Type, inject, Signal, effect, OnInit, EnvironmentInjector, createComponent } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { 
  InnerTabItem, 
  InnerTabActions, 
  InnerTabComponentType,
  selectInnerTabs,
  selectActiveInnerTabId,
  selectPendingRequestsForParent,
  TabRequest
} from '../store';
import { ParentTabId } from './constants';
import { BaseTabLauncher } from './base-tab-launcher';

/**
 * Abstract base class for components that manage inner tabs.
 * Provides all the logic needed to manage inner tabs within a parent tab context.
 * 
 * This replaces the InnerTabContainerComponent pattern, allowing wrapper components
 * to directly extend this class and include the template inline, eliminating an
 * extra component layer.
 * 
 * Features:
 * - Signal-based reactive state management
 * - Automatic pending request processing via effect
 * - Component registry resolution from launcher
 * - Tab lifecycle management (add, remove, activate)
 * 
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-tasks',
 *   imports: [CommonModule, TabsModule, ButtonModule],
 *   template: `
 *     <div class="inner-tab-container">
 *       <p-tabs [value]="activeTabId() ?? ''" (valueChange)="onTabValueChange($any($event))">
 *         <p-tablist>
 *           @for (tab of innerTabs(); track tab.id) {
 *             <p-tab [value]="tab.id">
 *               @if (tab.icon) { <i [class]="tab.icon"></i> }
 *               <span class="tab-title">{{ tab.title }}</span>
 *               @if (tab.closable) {
 *                 <button class="close-button" (click)="closeTab($event, tab.id)">
 *                   <i class="pi pi-times"></i>
 *                 </button>
 *               }
 *             </p-tab>
 *           }
 *         </p-tablist>
 *         <p-tabpanels>
 *           @for (tab of innerTabs(); track tab.id) {
 *             <p-tabpanel [value]="tab.id">
 *               <div class="inner-tab-content">
 *                 @if (getComponent(tab); as component) {
 *                   <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id }">
 *                   </ng-container>
 *                 }
 *               </div>
 *             </p-tabpanel>
 *           }
 *         </p-tabpanels>
 *       </p-tabs>
 *     </div>
 *   `,
 *   styleUrl: './tasks.component.scss'
 * })
 * export class TasksComponent extends BaseInnerTabContainer implements OnInit {
 *   protected override parentTabId = PARENT_TAB_IDS.TASKS;
 *   protected override launcherComponent = TaskLauncherComponent;
 *   protected override launcherTitle = 'Task Home';
 *   protected override launcherIcon = 'pi pi-home';
 * 
 *   ngOnInit(): void {
 *     this.initializeInnerTabs();
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseInnerTabContainer implements OnInit {
  /**
   * The ID of the parent tab this container belongs to.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  protected abstract parentTabId: ParentTabId;

  /**
   * The component class to use for the launcher tab.
   * Must extend BaseTabLauncher.
   */
  protected abstract launcherComponent: Type<BaseTabLauncher>;

  /**
   * Title for the launcher tab.
   * Override in subclass to customize.
   */
  protected launcherTitle: string = 'Home';

  /**
   * Icon for the launcher tab.
   * Override in subclass to customize.
   */
  protected launcherIcon: string = 'pi pi-home';

  /**
   * NgRx Store instance, injected automatically.
   */
  protected readonly store = inject(Store);

  /**
   * Environment injector for creating components outside injection context.
   */
  private readonly environmentInjector = inject(EnvironmentInjector);

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

  ngOnInit(): void {
    // Subclasses should call initializeInnerTabs() in their ngOnInit
  }

  /**
   * Initializes the inner tab system.
   * Must be called from subclass ngOnInit after setting parentTabId and launcherComponent.
   */
  protected initializeInnerTabs(): void {
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
    // Ensure launcher instance is available
    if (!this.launcherInstance?.componentType) {
      console.error('Launcher instance or componentType not found. Ensure launcher extends BaseTabLauncher and sets componentType.');
    }

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
  protected onTabValueChange(tabId: string): void {
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
  protected closeTab(event: Event, tabId: string): void {
    event.stopPropagation();
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Gets the component class for a given tab.
   * Note: launcherInstance is guaranteed to exist after ngOnInit,
   * but we check for safety in case this is called during initialization.
   */
  protected getComponent(tab: InnerTabItem): Type<unknown> | undefined {
    // Special case for launcher - use the provided component
    if (this.launcherInstance && tab.componentType === this.launcherInstance.componentType) {
      return this.launcherComponent;
    }
    // Get component from launcher's instance registry
    return this.launcherInstance?.componentRegistry.get(tab.componentType);
  }
}
