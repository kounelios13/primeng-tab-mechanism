import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { Store } from '@ngrx/store';
import { InnerTabActions, InnerTabComponentType } from '../../../store';
import { IInnerTabComponent, PARENT_TAB_IDS } from '../../../shared';

/**
 * Component to display task details in an inner tab.
 * Receives task data through the tabData input.
 *
 * Implements {@link IInnerTabComponent} so that the three standard inner-tab
 * inputs are declared consistently with the rest of the system.
 */
@Component({
  selector: 'app-task-detail',
  imports: [CommonModule, ButtonModule, TagModule, DividerModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit, IInnerTabComponent {
  /** Data passed from the inner tab system. */
  @Input() tabData?: Record<string, unknown>;

  /** The ID of this inner tab instance. */
  @Input() tabId?: string;

  /**
   * The parent tab context ID, passed automatically by BaseTabWrapper via
   * ngComponentOutlet.  Used when dispatching actions so that requests target
   * the correct NgRx context instead of relying on a hardcoded constant.
   */
  @Input() parentTabId?: string;

  private store = inject(Store);

  // Task properties derived from tabData
  taskId: string = '';
  taskTitle: string = '';
  
  // Mock task details for demonstration
  taskDetails = {
    description: 'This is a detailed description of the task. It includes all the information needed to complete the work.',
    assignee: 'John Doe',
    priority: 'High',
    status: 'In Progress',
    createdDate: new Date('2024-12-15'),
    dueDate: new Date('2024-12-25'),
    tags: ['Frontend', 'UI', 'Bug Fix'],
    comments: [
      { author: 'Jane Smith', text: 'Looking good so far!', date: new Date('2024-12-16') },
      { author: 'Bob Wilson', text: 'Please add unit tests', date: new Date('2024-12-17') }
    ]
  };

  ngOnInit(): void {
    if (this.tabData) {
      this.taskId = this.tabData['taskId'] as string || '';
      this.taskTitle = this.tabData['taskTitle'] as string || 'Task Details';
    }
  }

  /**
   * Opens the edit form for this task by dispatching a `requestAddInnerTab`
   * action.  The `parentTabId` input (set by `BaseTabWrapper`) is used so that
   * this component does not hard-code its parent context.
   */
  openEditForm(): void {
    const parentTabId = this.parentTabId ?? PARENT_TAB_IDS.TASKS;
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId,
      tab: {
        id: `task-edit-${this.taskId}`,
        parentTabId,
        title: `Edit: ${this.taskTitle}`,
        componentType: InnerTabComponentType.TaskForm,
        icon: 'pi pi-pencil',
        closable: true,
        data: { mode: 'edit', taskId: this.taskId, taskTitle: this.taskTitle }
      }
    }));
  }

  /**
   * Marks the task as complete.
   */
  markComplete(): void {
    // For demo purposes, just update the status
    this.taskDetails.status = 'Completed';
  }
}
