import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
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
  styleUrl: './tasks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent {
  /**
   * Parent tab ID constant for template binding.
   */
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;

  /**
   * The launcher component type for the tasks inner tabs.
   */
  readonly launcherComponent = TaskLauncherComponent;

  /**
   * The component type enum value for the launcher.
   */
  readonly launcherComponentType = InnerTabComponentType.TaskLauncher;
}
