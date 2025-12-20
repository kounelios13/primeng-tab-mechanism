import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectAllTabs, selectActiveTab, TabActions, TabItem } from '../store';
import { TasksComponent } from '../components/tasks/tasks.component';
import { OverviewComponent } from '../components/overview/overview.component';

@Component({
  selector: 'app-tab-panel',
  imports: [CommonModule, TabViewModule, TasksComponent, OverviewComponent],
  templateUrl: './tab-panel.component.html',
  styleUrl: './tab-panel.component.scss'
})
export class TabPanelComponent implements OnInit {
  tabs$: Observable<TabItem[]>;
  activeTab$: Observable<TabItem | undefined>;

  constructor(private store: Store) {
    this.tabs$ = this.store.select(selectAllTabs);
    this.activeTab$ = this.store.select(selectActiveTab);
  }

  ngOnInit(): void {
    // Clear existing tabs and add Tasks and Overview tabs
    const tasksTab: TabItem = {
      id: 'tasks',
      title: 'Tasks',
      content: 'Manage your tasks here',
      icon: 'pi pi-check-square'
    };
    
    const overviewTab: TabItem = {
      id: 'overview',
      title: 'Overview', 
      content: 'View project overview and summary',
      icon: 'pi pi-chart-bar'
    };

    this.store.dispatch(TabActions.addTab({ tab: tasksTab }));
    this.store.dispatch(TabActions.addTab({ tab: overviewTab }));
    
    // Set Tasks as the active tab
    this.store.dispatch(TabActions.setActiveTab({ id: 'tasks' }));
  }

  onTabChange(event: any): void {
    const tabs = this.getTabs();
    if (tabs && tabs[event.index]) {
      this.store.dispatch(TabActions.setActiveTab({ id: tabs[event.index].id }));
    }
  }

  private getTabs(): TabItem[] {
    let tabs: TabItem[] = [];
    this.tabs$.subscribe(t => tabs = t).unsubscribe();
    return tabs;
  }
}
