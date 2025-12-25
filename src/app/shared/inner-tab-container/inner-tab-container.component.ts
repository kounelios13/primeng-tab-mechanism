import { Component, Input, Type, inject, Signal, ChangeDetectionStrategy, effect, EnvironmentInjector, OnInit, Injector, runInInjectionContext } from '@angular/core';
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
  selectActiveInnerTabId
} from '../../store';
import { ParentTabId } from '../constants';
import { BaseTabLauncher } from '../base-tab-launcher';

/**
 * Generic container component for inner tabs.
 * This component manages a set of inner tabs within a parent tab context.
 * Uses Angular Signals for reactive state management.
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
  private readonly injector = inject(Injector);

  /**
   * The ID of the parent tab this container belongs to.
   */
  @Input({ required: true }) parentTabId!: ParentTabId;

  /**
   * The component class to use for the launcher tab.
   * Must extend BaseTabLauncher to provide the component registry.
   */
  @Input({ required: true }) launcherComponent!: Type<BaseTabLauncher>;

  /**
   * The component type enum value for the launcher.
   */
  @Input({ required: true }) launcherComponentType!: InnerTabComponentType;

  /**
   * Title for the launcher tab.
   */
  @Input() launcherTitle: string = 'Home';

  /**
   * Icon for the launcher tab.
   */
  @Input() launcherIcon: string = 'pi pi-home';

  /**
   * Lazy-loaded component registry from the launcher.
   */
  private _componentRegistry?: Map<InnerTabComponentType, Type<unknown>>;

  /**
   * Gets the component registry from the launcher class.
   */
  private get componentRegistry(): Map<InnerTabComponentType, Type<unknown>> {
    if (!this._componentRegistry && this.launcherComponent) {
      // Access the static method through the constructor
      const launcherClass = this.launcherComponent as any;
      if (launcherClass.getComponentRegistry) {
        this._componentRegistry = launcherClass.getComponentRegistry();
      } else {
        this._componentRegistry = new Map();
      }
    }
    return this._componentRegistry || new Map();
  }

  /**
   * Signal containing inner tabs for this parent.
   * Initialized in constructor after parentTabId is available.
   */
  protected innerTabs!: Signal<InnerTabItem[]>;
  
  /**
   * Signal containing the active tab ID.
   * Initialized in constructor after parentTabId is available.
   */
  protected activeTabId!: Signal<string | null>;

  /**
   * Flag to track if context has been initialized.
   */
  private contextInitialized = false;

  ngOnInit(): void {
    // Initialize signals in injection context
    runInInjectionContext(this.injector, () => {
      this.innerTabs = toSignal(
        this.store.select(selectInnerTabs(this.parentTabId)),
        { initialValue: [] }
      );
      this.activeTabId = toSignal(
        this.store.select(selectActiveInnerTabId(this.parentTabId)),
        { initialValue: null }
      );
    });

    // Initialize context after signals are ready
    if (!this.contextInitialized && this.parentTabId) {
      this.initializeContext();
      this.contextInitialized = true;
    }
  }

  constructor() {
    // Use effect to reactively update when tabs change
    // Note: innerTabs signal must be initialized in ngOnInit before this effect runs
    effect(() => {
      // Access the signal to establish dependency (only after ngOnInit)
      if (this.innerTabs) {
        const tabs = this.innerTabs();
        // Effect will run when tabs change
      }
    });
  }

  /**
   * Initializes the inner tab context with the launcher tab.
   */
  private initializeContext(): void {
    const launcherTab: InnerTabItem = {
      id: `${this.parentTabId}-launcher`,
      parentTabId: this.parentTabId,
      title: this.launcherTitle,
      componentType: this.launcherComponentType,
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
    if (tab.componentType === this.launcherComponentType) {
      return this.launcherComponent;
    }
    // Get component from launcher's static registry
    return this.componentRegistry.get(tab.componentType);
  }
}
