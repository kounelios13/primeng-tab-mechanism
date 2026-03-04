import { Component, inject, Signal, Type, OnInit, OnDestroy, Injector, effect } from '@angular/core';
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
 * Interface that all inner tab content components should implement.
 *
 * Applying this interface to inner tab components makes the contract explicit:
 * `BaseTabWrapper` passes these three inputs via `ngComponentOutlet`, and every
 * inner tab component is expected to accept them.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class TaskDetailComponent implements IInnerTabComponent {
 *   @Input() tabData?: Record<string, unknown>;
 *   @Input() tabId?: string;
 *   @Input() parentTabId?: string;
 * }
 * ```
 */
export interface IInnerTabComponent {
  /** Arbitrary data payload forwarded from the tab configuration */
  tabData?: Record<string, unknown>;
  /** Unique ID of this inner tab instance */
  tabId?: string;
  /** ID of the parent tab context this component lives in */
  parentTabId?: string;
}

/**
 * Abstract base component for tab wrappers.
 * Extend this component to create a wrapper that manages dynamic tabs.
 *
 * Each child class:
 * - Declares its own `parentTabId`
 * - Provides its own `componentRegistry` mapping component types to component classes
 * - Subscribes to store state filtered by its `parentTabId`
 * - Dispatches NgRx actions to open/close/manage tabs
 *
 * The base class automatically:
 * - Subscribes to pending tab requests from the store and processes them
 * - Renders the shared tab container template with dynamic component loading
 * - Handles tab switching and closing
 * - Cleans up its NgRx context on destroy
 *
 * ## Design pattern: Template Method
 * `canOpenTab()` is an optional hook (Template Method pattern) that subclasses can
 * override to add domain-specific validation before a tab is opened.
 *
 * @template TComponentType - The enum type used for component type keys
 *
 * @example Creating a wrapper for Projects
 * ```typescript
 * @Component({
 *   selector: 'app-projects',
 *   imports: [CommonModule, TabsModule, ButtonModule],
 *   templateUrl: '../../shared/base-tab-wrapper.html',
 *   styleUrl: '../../shared/base-tab-wrapper.scss'
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
 * }
 * ```
 */
@Component({
  selector: 'app-base-tab-wrapper',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './base-tab-wrapper.html',
  styleUrl: './base-tab-wrapper.scss'
})
export abstract class BaseTabWrapper<TComponentType extends string | number | undefined = InnerTabComponentType> implements OnInit, OnDestroy {
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
   * Override this in child classes to specify tabs that should appear automatically.
   */
  readonly initialTabs: InnerTabItem[] = [];

  /** NgRx Store instance. */
  protected store = inject(Store);

  /**
   * Component-level injector used to scope signals and effects to the component
   * lifetime, ensuring automatic cleanup when the component is destroyed.
   */
  private injector = inject(Injector);

  /** Signal containing the inner tabs for this parent context. */
  protected innerTabs!: Signal<InnerTabItem[]>;

  /** Signal containing the currently active inner tab ID. */
  protected activeTabId!: Signal<string | null>;

  /** Signal containing pending tab-open requests for this parent context. */
  private pendingRequests!: Signal<TabRequest[]>;

  ngOnInit(): void {
    // Initialise signals here (not in the constructor) because `parentTabId` is an
    // abstract property set by the child class – it is only available after the
    // child class field initialisers have run, which happens after the parent
    // constructor body.  By the time ngOnInit executes both constructor chains
    // have finished and parentTabId is guaranteed to be set.
    //
    // We pass the *component-level* injector so that `toSignal` uses the
    // component's DestroyRef for subscription cleanup (instead of the
    // application-level EnvironmentInjector which would never clean up).
    this.innerTabs = toSignal(
      this.store.select(selectInnerTabs(this.parentTabId)),
      { initialValue: [], injector: this.injector }
    );
    this.activeTabId = toSignal(
      this.store.select(selectActiveInnerTabId(this.parentTabId)),
      { initialValue: null, injector: this.injector }
    );
    this.pendingRequests = toSignal(
      this.store.select(selectPendingRequestsForParent(this.parentTabId)),
      { initialValue: [], injector: this.injector }
    );

    // Create the pending-request effect *after* all signals are initialised.
    // Passing the component injector ties the effect lifetime to the component,
    // so it is torn down automatically on ngOnDestroy.
    //
    // Angular effects run synchronously to completion; a new run is only
    // scheduled after the current one ends.  Because dispatching `addInnerTab`
    // removes the request from `pendingRequests` synchronously (NgRx reducers are
    // synchronous), each request is processed exactly once:
    //   run 1 reads [req1, req2] → dispatches both → signal becomes []
    //   run 2 reads []           → nothing to do
    effect(() => {
      const requests = this.pendingRequests();
      requests.forEach(request => this.handleTabRequest(request));
    }, { injector: this.injector });

    this.initializeContext();
  }

  /**
   * Cleans up the NgRx inner-tab context when the component is destroyed.
   * This prevents stale tab state from accumulating if the component is ever
   * recreated (e.g. after a route navigation).
   */
  ngOnDestroy(): void {
    if (this.parentTabId) {
      this.store.dispatch(InnerTabActions.clearContext({ parentTabId: this.parentTabId }));
    }
  }

  /**
   * Handles a pending tab-open request by dispatching the `addInnerTab` action.
   * The reducer removes the entry from `pendingRequests` as part of the same
   * state update, so the effect will not process it a second time.
   */
  private handleTabRequest(request: TabRequest): void {
    this.store.dispatch(InnerTabActions.addInnerTab({
      parentTabId: request.parentTabId,
      tab: request.tab
    }));
  }

  /**
   * Initialises the NgRx context for this parent tab and opens any `initialTabs`.
   */
  private initializeContext(): void {
    this.store.dispatch(InnerTabActions.initContext({
      parentTabId: this.parentTabId
    }));

    this.initialTabs.forEach(tab => {
      this.store.dispatch(InnerTabActions.addInnerTab({
        parentTabId: this.parentTabId,
        tab: { ...tab, parentTabId: this.parentTabId }
      }));
    });
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
   * Closes a tab in response to a UI close-button click.
   * Stops event propagation so the tab is not simultaneously activated.
   */
  closeTab(event: Event, tabId: string): void {
    event.stopPropagation();
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Returns the component class registered for the given tab, or `undefined`
   * if the component type is not in the registry.
   */
  getComponent(tab: InnerTabItem): Type<unknown> | undefined {
    return this.componentRegistry.get(tab.componentType);
  }

  /**
   * Opens a new inner tab within this parent tab context.
   *
   * Applies singleton and custom validation before dispatching the
   * `requestAddInnerTab` action.  The request is processed asynchronously by
   * the pending-request effect.
   *
   * @param config - Configuration for the new inner tab (without `parentTabId`,
   *                 which is added automatically).
   * @returns `true` if the tab request was dispatched; `false` if blocked by
   *          singleton logic or `canOpenTab`.
   */
  openInnerTab(config: InnerTabConfig): boolean {
    const tabs = this.innerTabs();

    // Singleton guard: focus existing tab of the same component type
    if (config.singleton) {
      const existingTab = tabs.find(tab => tab.componentType === config.componentType);
      if (existingTab) {
        this.focusExistingTab(existingTab.id);
        return false;
      }
    }

    // Template Method hook: subclasses may add domain-specific validation
    if (!this.canOpenTab(config.componentType as TComponentType, config)) {
      return false;
    }

    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: this.parentTabId,
      tab: { ...config, parentTabId: this.parentTabId }
    }));

    return true;
  }

  /**
   * Template Method hook – override in subclasses to add domain-specific
   * validation before a tab is opened.
   *
   * @returns `true` to allow the tab to open; `false` to block it.
   */
  protected canOpenTab(componentType: TComponentType, config: InnerTabConfig): boolean {
    return true;
  }

  /**
   * Returns `true` if at least one tab with the given component type is open.
   */
  isTabTypeOpen(componentType: TComponentType): boolean {
    return this.innerTabs().some(tab => tab.componentType === componentType);
  }

  /**
   * Returns the first open tab with the given component type, or `undefined`.
   */
  findTabByType(componentType: TComponentType): InnerTabItem | undefined {
    return this.innerTabs().find(tab => tab.componentType === componentType);
  }

  /**
   * Returns the tab with the given ID, or `undefined`.
   */
  findTabById(tabId: string): InnerTabItem | undefined {
    return this.innerTabs().find(tab => tab.id === tabId);
  }

  /**
   * Makes an existing tab the active (visible) tab.
   */
  focusExistingTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Closes the inner tab with the given ID.
   */
  closeInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.removeInnerTab({
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
   * The random suffix makes collisions extremely unlikely even without a
   * centralised ID sequence.
   */
  generateTabId(prefix: string = 'tab'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Returns all currently open inner tabs for this parent context.
   */
  getTabs(): InnerTabItem[] {
    return this.innerTabs();
  }

  /**
   * Returns the number of currently open inner tabs.
   */
  getTabCount(): number {
    return this.innerTabs().length;
  }
}
