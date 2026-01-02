import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseInnerTabContainer, PARENT_TAB_IDS } from '../../shared';
import { TaskLauncherComponent } from './task-launcher/task-launcher.component';

/**
 * Main Tasks tab component.
 * Extends BaseInnerTabContainer to directly manage nested tabs for task operations.
 * This eliminates the need for a separate InnerTabContainerComponent wrapper.
 */
@Component({
  selector: 'app-tasks',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent extends BaseInnerTabContainer implements OnInit {
  protected override parentTabId = PARENT_TAB_IDS.TASKS;
  protected override launcherComponent = TaskLauncherComponent;
  protected override launcherTitle = 'Task Home';
  protected override launcherIcon = 'pi pi-home';

  override ngOnInit(): void {
    this.initializeInnerTabs();
  }
}
