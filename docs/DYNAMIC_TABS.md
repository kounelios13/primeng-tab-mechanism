# Dynamic Tab System

This document explains the dynamic tab system architecture using `BaseTabWrapper`.

## Overview

The tab system uses a simple architecture where:
1. Components extend `BaseTabWrapper` to manage inner tabs
2. Initial tabs are defined in the component
3. New tabs are opened by dispatching actions through the store
4. From any inner tab component, you can dispatch actions to open new tabs

## Architecture

```
BaseTabWrapper (abstract base component)
├── TasksComponent extends BaseTabWrapper
│   ├── TaskDetailComponent (inner tab content)
│   └── TaskFormComponent (inner tab content)
├── OverviewComponent extends BaseTabWrapper
│   ├── OverviewChartComponent (inner tab content)
│   └── OverviewReportComponent (inner tab content)
└── ProjectsComponent extends BaseTabWrapper
    ├── ProjectDetailComponent (inner tab content)
    └── ProjectSettingsComponent (inner tab content)
```

## Creating a Tab Wrapper Component

Each parent tab component extends `BaseTabWrapper`:

```typescript
import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem, InnerTabConfig } from '../../store';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { TaskFormComponent } from './task-form/task-form.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  template: `
    <div class="inner-tab-container">
      @if (innerTabs().length > 0) {
        <p-tabs 
          [value]="activeTabId() ?? ''"
          (valueChange)="onTabValueChange($any($event))">
          <p-tablist>
            @for (tab of innerTabs(); track tab.id) {
              <p-tab [value]="tab.id">
                @if (tab.icon) { <i [class]="tab.icon"></i> }
                <span>{{ tab.title }}</span>
                @if (tab.closable) {
                  <button (click)="closeTab($event, tab.id)">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </p-tab>
            }
          </p-tablist>
          <p-tabpanels>
            @for (tab of innerTabs(); track tab.id) {
              <p-tabpanel [value]="tab.id">
                @if (getComponent(tab); as component) {
                  <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id }"></ng-container>
                }
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `
})
export class TasksComponent extends BaseTabWrapper<InnerTabComponentType> {
  // Required: Parent tab ID
  readonly parentTabId = PARENT_TAB_IDS.TASKS;

  // Required: Component registry maps component types to component classes
  readonly componentRegistry: ComponentRegistry = new Map([
    [InnerTabComponentType.TaskDetail, TaskDetailComponent],
    [InnerTabComponentType.TaskForm, TaskFormComponent]
  ]);
  
  // Optional: Initial tabs to open automatically
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

  // Optional: Custom validation for opening tabs
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    // Example: Limit to 5 detail tabs
    if (componentType === InnerTabComponentType.TaskDetail) {
      return this.innerTabs().filter(t => t.componentType === componentType).length < 5;
    }
    return true;
  }

  // Custom methods to open specific tabs
  openNewTaskForm(): void {
    this.openInnerTab({
      id: 'task-new-form',
      title: 'New Task',
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-plus',
      closable: true,
      singleton: true,  // Only one instance allowed
      data: { mode: 'create' }
    });
  }

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
}
```

## Opening Tabs from Inner Tab Components

Inner tab components can dispatch actions to open new tabs:

```typescript
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { InnerTabActions, InnerTabComponentType } from '../../store';
import { PARENT_TAB_IDS } from '../../shared';

@Component({
  selector: 'app-task-detail',
  template: `
    <div>
      <h3>{{ taskTitle }}</h3>
      <button (click)="openEditForm()">Edit Task</button>
      <button (click)="openRelatedTask('2', 'Related Task')">Open Related Task</button>
    </div>
  `
})
export class TaskDetailComponent {
  @Input() tabData?: Record<string, unknown>;
  @Input() tabId?: string;

  private store = inject(Store);

  get taskId(): string {
    return this.tabData?.['taskId'] as string || '';
  }

  get taskTitle(): string {
    return this.tabData?.['taskTitle'] as string || '';
  }

  openEditForm(): void {
    // Dispatch action to open a new tab
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: PARENT_TAB_IDS.TASKS,
      tab: {
        id: `task-edit-${this.taskId}`,
        parentTabId: PARENT_TAB_IDS.TASKS,
        title: `Edit: ${this.taskTitle}`,
        componentType: InnerTabComponentType.TaskForm,
        icon: 'pi pi-pencil',
        closable: true,
        data: { mode: 'edit', taskId: this.taskId, taskTitle: this.taskTitle }
      }
    }));
  }

  openRelatedTask(taskId: string, taskTitle: string): void {
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: PARENT_TAB_IDS.TASKS,
      tab: {
        id: `task-detail-${taskId}`,
        parentTabId: PARENT_TAB_IDS.TASKS,
        title: taskTitle,
        componentType: InnerTabComponentType.TaskDetail,
        icon: 'pi pi-file',
        closable: true,
        data: { taskId, taskTitle }
      }
    }));
  }
}
```

## Available Store Actions

```typescript
// Request to add a new inner tab
InnerTabActions.requestAddInnerTab({ parentTabId, tab })

// Set the active inner tab
InnerTabActions.setActiveInnerTab({ parentTabId, tabId })

// Remove an inner tab
InnerTabActions.removeInnerTab({ parentTabId, tabId })

// Update an inner tab's properties
InnerTabActions.updateInnerTab({ parentTabId, tabId, updates })
```

## BaseTabWrapper Methods

The `BaseTabWrapper` provides these helper methods:

| Method | Description |
|--------|-------------|
| `openInnerTab(config)` | Opens a new tab, handles singleton logic |
| `closeInnerTab(tabId)` | Closes a tab by ID |
| `closeTab(event, tabId)` | Event handler for close button |
| `focusExistingTab(tabId)` | Activates an existing tab |
| `findTabById(tabId)` | Find tab by ID |
| `findTabByType(type)` | Find tab by component type |
| `isTabTypeOpen(type)` | Check if type is open |
| `generateTabId(prefix)` | Generate unique ID |
| `innerTabs()` | Signal of current tabs |
| `activeTabId()` | Signal of active tab ID |
| `getComponent(tab)` | Get component class for tab |
| `onTabValueChange(tabId)` | Handle tab switch |

## Adding New Component Types

1. Add to the enum in `src/app/store/inner-tab.actions.ts`:

```typescript
export enum InnerTabComponentType {
  TaskDetail = 'task-detail',
  TaskForm = 'task-form',
  // Add new types here
  MyNewComponent = 'my-new-component'
}
```

2. Register in your wrapper's component registry:

```typescript
readonly componentRegistry: ComponentRegistry = new Map([
  [InnerTabComponentType.TaskDetail, TaskDetailComponent],
  [InnerTabComponentType.MyNewComponent, MyNewComponent]
]);
```
