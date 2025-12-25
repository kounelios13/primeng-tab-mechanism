import { Component, Input, Type, inject, Signal, ChangeDetectionStrategy, effect, EnvironmentInjector, createComponent, ViewContainerRef, viewChild } from '@angular/core';
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
export class InnerTabContainerComponent {
  private readonly store = inject(Store);
  private readonly environmentInjector = inject(EnvironmentInjector);

  /**
   * The ID of the parent tab this container belongs to.
   */
  @Input({ required: true }) parentTabId!: ParentTabId;

  /**
   * The component class to use for the launcher tab.
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
   * Reference to the launcher instance to access its component registry.
   */
  private launcherInstance?: BaseTabLauncher;

  /**
   * Signal containing inner tabs for this parent.
   * Initialized lazily due to parentTabId being an Input.
   */
  private _innerTabs?: Signal<InnerTabItem[]>;
  
  get innerTabs(): Signal<InnerTabItem[]> {
    if (!this._innerTabs) {
      this._innerTabs = toSignal(
        this.store.select(selectInnerTabs(this.parentTabId)),
        { initialValue: [] }
      );
    }
    return this._innerTabs;
  }

  /**
   * Signal containing the active tab ID.
   * Initialized lazily due to parentTabId being an Input.
   */
  private _activeTabId?: Signal<string | null>;
  
  get activeTabId(): Signal<string | null> {
    if (!this._activeTabId) {
      this._activeTabId = toSignal(
        this.store.select(selectActiveInnerTabId(this.parentTabId)),
        { initialValue: null }
      );
    }
    return this._activeTabId;
  }

  /**
   * Flag to track if context has been initialized.
   */
  private contextInitialized = false;

  constructor() {
    // Use effect to initialize context when parentTabId becomes available
    effect(() => {
      // Access the signal to establish dependency
      const tabs = this.innerTabs();
      
      // Initialize context only once when we have the parentTabId
      if (!this.contextInitialized && this.parentTabId) {
        this.initializeContext();
        this.contextInitialized = true;
      }
    });

    // Create launcher instance to access its component registry
    effect(() => {
      if (this.launcherComponent && !this.launcherInstance) {
        const componentRef = createComponent(this.launcherComponent, {
          environmentInjector: this.environmentInjector
        });
        this.launcherInstance = componentRef.instance as BaseTabLauncher;
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
    // Get component from launcher's registry
    return this.launcherInstance?.getComponentFromRegistry(tab.componentType);
  }
}
