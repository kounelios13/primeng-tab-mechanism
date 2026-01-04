import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem, InnerTabConfig } from '../../store';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { TaskFormComponent } from './task-form/task-form.component';

/**
 * Main Tasks component that extends BaseTabWrapper.
 * This component:
 * - Defines the component registry for task-related components
 * - Provides initial tabs to open automatically
 * - Listens to store actions filtered by its parentTabId
 * - Dispatches actions through the store to manage tabs
 */
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  template: `
    <div class="inner-tab-container">
      @if (innerTabs().length > 0) {
        <p-tabs 
          [value]="activeTabId() ?? ''"
          (valueChange)="onTabValueChange($any($event))"
          styleClass="inner-tabs">
          
          <p-tablist>
            @for (tab of innerTabs(); track tab.id) {
              <p-tab [value]="tab.id" class="inner-tab-header">
                @if (tab.icon) {
                  <i [class]="tab.icon"></i>
                }
                <span class="tab-title">{{ tab.title }}</span>
                @if (tab.closable) {
                  <button 
                    class="close-button"
                    (click)="closeTab($event, tab.id)"
                    title="Close tab">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </p-tab>
            }
          </p-tablist>
          
          <p-tabpanels>
            @for (tab of innerTabs(); track tab.id) {
              <p-tabpanel [value]="tab.id">
                <div class="inner-tab-content">
                  @if (getComponent(tab); as component) {
                    <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id, parentTabId: parentTabId }"></ng-container>
                  } @else {
                    <div class="no-component-warning">
                      <i class="pi pi-exclamation-triangle"></i>
                      <p>Component not registered for type: {{ tab.componentType }}</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
  styles: [`
    .inner-tab-container {
      height: 100%;
    }

    .inner-tab-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab-title {
      margin: 0 0.25rem;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s, background-color 0.2s;
    }

    .close-button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .inner-tab-content {
      padding: 1rem;
    }

    .no-component-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #dc3545;
    }

    .no-component-warning i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export class TasksComponent extends BaseTabWrapper<InnerTabComponentType> {
  /**
   * Parent tab ID for this wrapper.
   */
  readonly parentTabId = PARENT_TAB_IDS.TASKS;

  /**
   * Component registry for task-related inner tabs.
   * Maps component types to their component classes for dynamic loading.
   */
  readonly componentRegistry: ComponentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.TaskDetail, TaskDetailComponent],
    [InnerTabComponentType.TaskForm, TaskFormComponent]
  ]);
  
  /**
   * Initial tabs to open when the Tasks tab is activated.
   * In this case, we open a task detail tab by default.
   */
  override readonly initialTabs: InnerTabItem[] = [
    {
      id: 'task-detail-1',
      parentTabId: PARENT_TAB_IDS.TASKS,
      title: 'Update Documentation',
      componentType: InnerTabComponentType.TaskDetail,
      icon: 'pi pi-file',
      closable: true,
      data: { taskId: '1', taskTitle: 'Update Documentation' }
    }
  ];

  /**
   * Override canOpenTab for custom validation logic.
   * Prevent opening more than 5 detail tabs.
   */
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    if (componentType === InnerTabComponentType.TaskDetail) {
      const detailTabCount = this.innerTabs().filter(
        tab => tab.componentType === InnerTabComponentType.TaskDetail
      ).length;
      if (detailTabCount >= 5) {
        return false;
      }
    }
    return true;
  }

  /**
   * Opens a new task form.
   * This is a SINGLETON - only one "New Task" form can be open at a time.
   */
  openNewTaskForm(): void {
    this.openInnerTab({
      id: 'task-new-form',
      title: 'New Task',
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-plus',
      closable: true,
      singleton: true,
      data: { mode: 'create' }
    });
  }

  /**
   * Opens a task detail view for a specific task.
   */
  openTaskDetail(taskId: string, taskTitle: string): void {
    const tabId = `task-detail-${taskId}`;
    const existingTab = this.findTabById(tabId);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: tabId,
      title: taskTitle,
      componentType: InnerTabComponentType.TaskDetail,
      icon: 'pi pi-file',
      closable: true,
      data: { taskId, taskTitle }
    });
  }

  /**
   * Opens an edit form for a specific task.
   */
  openEditTaskForm(taskId: string, taskTitle: string): void {
    const tabId = `task-edit-${taskId}`;
    const existingTab = this.findTabById(tabId);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: tabId,
      title: `Edit: ${taskTitle}`,
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-pencil',
      closable: true,
      data: { mode: 'edit', taskId, taskTitle }
    });
  }
}
