import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { TaskLauncherComponent } from './task-launcher/task-launcher.component';

/**
 * Main Tasks tab component.
 * Uses the InnerTabContainerComponent to manage nested tabs for task operations.
 */
@Component({
  selector: 'app-tasks',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.TASKS"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Task Home'"
      [launcherIcon]="'pi pi-home'">
    </app-inner-tab-container>
  `
})
export class TasksComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = TaskLauncherComponent;
}
