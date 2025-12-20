import { Component, Input, OnInit, OnDestroy, ComponentRef, Type, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { 
  InnerTabItem, 
  InnerTabActions, 
  InnerTabComponentType,
  selectInnerTabs,
  selectActiveInnerTabId
} from '../../store';
import { getTabComponent } from '../tab-component-registry';

/**
 * Generic container component for inner tabs.
 * This component manages a set of inner tabs within a parent tab context.
 * 
 * @example
 * ```html
 * <app-inner-tab-container
 *   [parentTabId]="'tasks'"
 *   [launcherComponent]="TaskLauncherComponent"
 *   [launcherComponentType]="InnerTabComponentType.TaskLauncher">
 * </app-inner-tab-container>
 * ```
 */
@Component({
  selector: 'app-inner-tab-container',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './inner-tab-container.component.html',
  styleUrl: './inner-tab-container.component.scss'
})
export class InnerTabContainerComponent implements OnInit, OnDestroy {
  /**
   * The ID of the parent tab this container belongs to.
   */
  @Input({ required: true }) parentTabId!: string;

  /**
   * The component class to use for the launcher tab.
   */
  @Input({ required: true }) launcherComponent!: Type<unknown>;

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
   * Observable of inner tabs for this parent.
   */
  innerTabs$!: Observable<InnerTabItem[]>;

  /**
   * Observable of the active tab ID.
   */
  activeTabId$!: Observable<string | null>;

  /**
   * Current active tab ID for binding.
   */
  activeTabId: string | null = null;

  /**
   * Subject for cleanup on destroy.
   */
  private destroy$ = new Subject<void>();

  /**
   * Map to track component refs for cleanup.
   */
  private componentRefs: Map<string, ComponentRef<unknown>> = new Map();

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize the inner tab context with the launcher tab
    this.initializeContext();

    // Set up observables
    this.innerTabs$ = this.store.select(selectInnerTabs(this.parentTabId));
    this.activeTabId$ = this.store.select(selectActiveInnerTabId(this.parentTabId));

    // Subscribe to active tab ID changes
    this.activeTabId$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(tabId => {
        console.log('[InnerTabContainer] Active tab ID changed to:', tabId);
        if (this.activeTabId !== tabId) {
          this.activeTabId = tabId;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up component refs
    this.componentRefs.forEach(ref => ref.destroy());
    this.componentRefs.clear();
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
    console.log('[InnerTabContainer] onTabValueChange - user selected tab:', tabId);
    if (tabId && tabId !== this.activeTabId) {
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
    return getTabComponent(tab.componentType);
  }

  /**
   * TrackBy function for ngFor optimization.
   */
  trackByTabId(index: number, tab: InnerTabItem): string {
    return tab.id;
  }
}
