import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

/**
 * Component for creating or editing tasks.
 * Mode is determined by tabData.mode ('create' or 'edit').
 */
@Component({
  selector: 'app-task-form',
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextModule, 
    Textarea,
    DropdownModule,
    CalendarModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormComponent implements OnInit {
  /**
   * Data passed from the inner tab system.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this inner tab.
   */
  @Input() tabId?: string;

  // Form mode
  isEditMode = false;
  taskId: string = '';

  // Form data
  formData = {
    title: '',
    description: '',
    priority: null as string | null,
    status: null as string | null,
    assignee: null as string | null,
    dueDate: null as Date | null
  };

  // Dropdown options
  priorities = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
  ];

  statuses = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Review', value: 'Review' },
    { label: 'Completed', value: 'Completed' }
  ];

  assignees = [
    { label: 'John Doe', value: 'john' },
    { label: 'Jane Smith', value: 'jane' },
    { label: 'Bob Wilson', value: 'bob' }
  ];

  ngOnInit(): void {
    if (this.tabData) {
      this.isEditMode = this.tabData['mode'] === 'edit';
      this.taskId = this.tabData['taskId'] as string || '';
      
      if (this.isEditMode) {
        // In a real app, you would load the task data here
        this.formData.title = this.tabData['taskTitle'] as string || '';
      }
    }
  }

  onSubmit(): void {
    console.log('Form submitted:', this.formData);
    // In a real app, dispatch an action to save the task
  }

  onCancel(): void {
    // In a real app, you might dispatch an action to close this tab
    console.log('Form cancelled');
  }
}
