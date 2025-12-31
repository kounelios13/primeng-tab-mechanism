import { Component, inject, ChangeDetectionStrategy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TabsModule } from 'primeng/tabs';
import { Store } from '@ngrx/store';
import { selectAllTabs, selectActiveTabId, TabActions, TabItem } from '../store';
import { TasksComponent } from '../components/tasks/tasks.component';
import { OverviewComponent } from '../components/overview/overview.component';
import { ProjectsComponent } from '../components/projects/projects.component';
import { PARENT_TAB_IDS } from '../shared';

/**
 * Main tab panel component that manages the top-level tabs.
 * Uses Angular Signals for reactive state management.
 */
@Component({
  selector: 'app-tab-panel',
  imports: [CommonModule, TabsModule, TasksComponent, OverviewComponent, ProjectsComponent],
  templateUrl: './tab-panel.component.html',
  styleUrl: './tab-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabPanelComponent {
  private readonly store = inject(Store);

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
}
