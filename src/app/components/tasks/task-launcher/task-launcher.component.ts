import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType, InnerTabConfig } from '../../../store';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { TaskFormComponent } from '../task-form/task-form.component';

/**
 * Launcher component for the Tasks inner tab system.
 * Provides buttons to open various task-related inner tabs.
 * 
 * Demonstrates singleton tab usage:
 * - TaskForm for new tasks is a singleton (only one can be open)
 * - TaskDetail tabs are NOT singletons (multiple can be open)
 * - TaskForm for editing is NOT a singleton (can edit multiple tasks)
 */
@Component({
  selector: 'app-task-launcher',
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './task-launcher.component.html',
  styleUrl: './task-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.TASKS;

  /**
   * Initialize the component registry with task-specific components.
   */
  protected initializeComponentRegistry(): void {
    this.registerComponent(InnerTabComponentType.TaskDetail, TaskDetailComponent);
    this.registerComponent(InnerTabComponentType.TaskForm, TaskFormComponent);
  }

  // Sample task data for demonstration
  recentTasks = [
    { id: '1', title: 'Update documentation', status: 'In Progress' },
    { id: '2', title: 'Review pull requests', status: 'Pending' },
    { id: '3', title: 'Fix navigation bug', status: 'Completed' },
    { id: '4', title: 'Design new dashboard', status: 'In Progress' }
  ];

  /**
   * Override canOpenTab for custom validation logic.
   * Example: Prevent opening more than 5 detail tabs.
   */
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    // Example: Limit number of TaskDetail tabs to 5
    if (componentType === InnerTabComponentType.TaskDetail) {
      const detailTabCount = this.currentTabs().filter(
        tab => tab.componentType === InnerTabComponentType.TaskDetail
      ).length;
      if (detailTabCount >= 5) {
        return false;
      }
    }
    return true;
  }

  /**
   * Opens a new task form to create a task.
   * This is a SINGLETON - only one "New Task" form can be open at a time.
   */
  openNewTaskForm(): void {
    this.openInnerTab({
      id: 'task-new-form',  // Fixed ID for singleton
      title: 'New Task',
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-plus',
      closable: true,
      singleton: true,  // Only one instance allowed
      data: { mode: 'create' }
    });
  }

  /**
   * Opens a task detail view for a specific task.
   * Multiple detail tabs can be open (NOT a singleton).
   */
  openTaskDetail(taskId: string, taskTitle: string): void {
    // Check if this specific task is already open
    const existingTab = this.findTabById(`task-detail-${taskId}`);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: `task-detail-${taskId}`,
      title: taskTitle,
      componentType: InnerTabComponentType.TaskDetail,
      icon: 'pi pi-file',
      closable: true,
      data: { taskId, taskTitle }
    });
  }

  /**
   * Opens an edit form for a specific task.
   * Multiple edit tabs can be open (NOT a singleton by type, but unique per task).
   */
  openEditTaskForm(taskId: string, taskTitle: string): void {
    // Check if this specific task edit is already open
    const existingTab = this.findTabById(`task-edit-${taskId}`);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: `task-edit-${taskId}`,
      title: `Edit: ${taskTitle}`,
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-pencil',
      closable: true,
      data: { mode: 'edit', taskId, taskTitle }
    });
  }
}
