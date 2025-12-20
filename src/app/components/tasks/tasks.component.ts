import { Component } from '@angular/core';
import { InnerTabContainerComponent } from '../../shared/inner-tab-container/inner-tab-container.component';
import { TaskLauncherComponent } from './task-launcher/task-launcher.component';
import { InnerTabComponentType } from '../../store';

/**
 * Main Tasks tab component.
 * Uses the InnerTabContainerComponent to manage nested tabs for task operations.
 */
@Component({
  selector: 'app-tasks',
  imports: [InnerTabContainerComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent {
  /**
   * The launcher component type for the tasks inner tabs.
   */
  readonly launcherComponent = TaskLauncherComponent;

  /**
   * The component type enum value for the launcher.
   */
  readonly launcherComponentType = InnerTabComponentType.TaskLauncher;
}
