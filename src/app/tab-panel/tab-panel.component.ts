import { Component, inject, signal, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Store } from '@ngrx/store';
import { selectAllTabs, selectActiveTabId, TabActions, TabItem } from '../store';
import { TasksComponent } from '../components/tasks/tasks.component';
import { OverviewComponent } from '../components/overview/overview.component';
import { ProjectsComponent } from '../components/projects/projects.component';
import { PARENT_TAB_IDS } from '../shared';

/**
 * Main tab panel component that manages the top-level tabs.
 * Uses Angular Signals for reactive state management.
 * Uses Angular Animations for sidebar toggle transitions.
 */
@Component({
  selector: 'app-tab-panel',
  imports: [CommonModule, TabsModule, ButtonModule, TooltipModule, TasksComponent, OverviewComponent, ProjectsComponent],
  templateUrl: './tab-panel.component.html',
  styleUrl: './tab-panel.component.scss',
  animations: [
    trigger('sidebarState', [
      state('expanded', style({
        width: '250px',
        minWidth: '250px'
      })),
      state('collapsed', style({
        width: '60px',
        minWidth: '60px'
      })),
      transition('expanded <=> collapsed', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('labelVisibility', [
      state('visible', style({
        opacity: 1,
        width: '*',
        transform: 'translateX(0)'
      })),
      state('hidden', style({
        opacity: 0,
        width: '0',
        transform: 'translateX(-10px)'
      })),
      transition('visible => hidden', [
        animate('150ms ease-out')
      ]),
      transition('hidden => visible', [
        animate('200ms 100ms ease-in')
      ])
    ])
  ]
})
export class TabPanelComponent {
  private readonly store = inject(Store);

  /**
   * Signal to control whether tab labels are shown in the sidebar.
   * When false, only icons are displayed.
   */
  readonly showLabels = signal(true);

  /**
   * Computed signal for sidebar animation state.
   */
  readonly sidebarAnimationState = computed(() => 
    this.showLabels() ? 'expanded' : 'collapsed'
  );

  /**
   * Computed signal for label visibility animation state.
   */
  readonly labelAnimationState = computed(() => 
    this.showLabels() ? 'visible' : 'hidden'
  );

  /**
   * Signal containing all tabs from the store.
   */
  readonly tabs: Signal<TabItem[]> = toSignal(
    this.store.select(selectAllTabs),
    { initialValue: [] }
  );

  /**
   * Signal containing the active tab ID from the store.
   */
  readonly activeTabId: Signal<string | null> = toSignal(
    this.store.select(selectActiveTabId),
    { initialValue: null }
  );

  /**
   * Expose PARENT_TAB_IDS for template use.
   */
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;

  /**
   * Handles tab value change events from PrimeNG Tabs.
   */
  onTabValueChange(tabId: string): void {
    if (tabId && tabId !== this.activeTabId()) {
      this.store.dispatch(TabActions.setActiveTab({ id: tabId }));
    }
  }

  /**
   * Toggles the visibility of tab labels in the sidebar.
   */
  toggleLabels(): void {
    this.showLabels.update(value => !value);
  }
}
