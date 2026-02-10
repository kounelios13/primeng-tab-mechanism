# Dynamic Tab System

This document explains the dynamic tab system architecture using `BaseTabWrapper`.

## Overview

The tab system uses a simple architecture where:
1. Components extend `BaseTabWrapper` to manage inner tabs
2. All wrapper components share the same template and styles
3. Initial tabs are defined in the component
4. New tabs are opened by dispatching actions through the store
5. From any inner tab component, you can dispatch actions to open new tabs

## Architecture

```
BaseTabWrapper (abstract base component)
├── base-tab-wrapper.html  (shared template)
├── base-tab-wrapper.scss  (shared styles)
│
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

## Key Concepts

### Parent Tab ID

Each tab wrapper is associated with a unique `parentTabId` from the `PARENT_TAB_IDS` constants. This ID is used to:
- Scope inner tabs to their parent context
- Filter store selectors to the correct tab context
- Dispatch actions to the correct parent

### Component Registry

Each wrapper defines a `componentRegistry` that maps `InnerTabComponentType` enum values to their corresponding component classes. This enables dynamic component loading within the tab panels.

### Initial Tabs

Wrappers can optionally define `initialTabs` - an array of tabs that open automatically when the wrapper is initialized.

## Creating a Tab Wrapper Component

Each parent tab component extends `BaseTabWrapper` and uses the shared template:

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
  // Use shared template and styles - no need to duplicate!
  templateUrl: '../../shared/base-tab-wrapper.html',
  styleUrl: '../../shared/base-tab-wrapper.scss'
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

## Shared Template Structure

The shared template (`base-tab-wrapper.html`) handles:
- Tab list rendering with icons
- Close buttons for closable tabs
- Tab panel rendering with dynamic component loading
- Fallback message for unregistered component types

You don't need to write any template code - just extend `BaseTabWrapper` and define your component registry!

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

## Cross-Parent Navigation Pattern (Jump from one main tab to another + specific inner tab)

If you want to navigate from one area (for example `Tasks`) to a specific inner tab in another area (for example `Overview -> Reports`), use a **two-step dispatch pattern**.

### Why this works well

1. The main tab and inner tabs stay decoupled.
2. Any component can trigger cross-navigation (buttons, links, table rows, notifications).
3. It is idempotent when you reuse deterministic tab IDs.

### Step 1: Activate the target parent (main) tab

Dispatch the main tab action first:

```typescript
this.store.dispatch(TabActions.setActiveTab({ id: PARENT_TAB_IDS.OVERVIEW }));
```

### Step 2: Open/focus the target inner tab in that parent

Immediately dispatch an inner-tab request for the same parent context:

```typescript
this.store.dispatch(InnerTabActions.requestAddInnerTab({
  parentTabId: PARENT_TAB_IDS.OVERVIEW,
  tab: {
    id: `overview-report-${reportId}`,
    parentTabId: PARENT_TAB_IDS.OVERVIEW,
    title: `Report ${reportName}`,
    componentType: InnerTabComponentType.OverviewReport,
    icon: 'pi pi-chart-line',
    closable: true,
    data: { reportId, reportName }
  }
}));
```

Because wrappers already process `requestAddInnerTab`, this will create (or focus, if you handle duplicates) the exact inner tab after the parent is active.

### Recommended implementation shape: Navigation Facade

Create a small facade/service to keep this behavior consistent everywhere:

```typescript
@Injectable({ providedIn: 'root' })
export class TabNavigationFacade {
  private readonly store = inject(Store);

  openOverviewReport(reportId: string, reportName: string): void {
    this.store.dispatch(TabActions.setActiveTab({ id: PARENT_TAB_IDS.OVERVIEW }));
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: PARENT_TAB_IDS.OVERVIEW,
      tab: {
        id: `overview-report-${reportId}`,
        parentTabId: PARENT_TAB_IDS.OVERVIEW,
        title: `Report ${reportName}`,
        componentType: InnerTabComponentType.OverviewReport,
        icon: 'pi pi-chart-line',
        closable: true,
        data: { reportId, reportName }
      }
    }));
  }
}
```

Then from any component:

```typescript
this.tabNavigation.openOverviewReport('42', 'Quarterly KPI');
```

### Design tips

- Use stable IDs (`overview-report-${reportId}`) so repeated clicks focus existing tabs rather than creating duplicates.
- Keep parent IDs and component types in shared constants/enums (already done in this project).
- Prefer facade methods over scattered inline dispatches to keep navigation rules centralized.

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

## Store Structure

### Inner Tab State

The inner tab state is organized by parent tab context:

```typescript
interface InnerTabState {
  contexts: Record<string, InnerTabContextState>;
  pendingRequests: TabRequest[];
}

interface InnerTabContextState {
  innerTabs: InnerTabItem[];
  activeInnerTabId: string | null;
}
```

### Pending Requests Pattern

The system uses a request-based pattern for opening tabs:

1. **Request**: `InnerTabActions.requestAddInnerTab` adds a pending request to the store
2. **Process**: The `BaseTabWrapper` watches for pending requests via an effect
3. **Complete**: The wrapper dispatches `InnerTabActions.addInnerTab` to actually add the tab

This pattern enables decoupled tab opening from any component in the application.

## Troubleshooting

### Component Not Rendering

If a tab shows "Component not registered for type", ensure:
1. The component is registered in the wrapper's `componentRegistry`
2. The `componentType` value matches exactly between the tab config and registry

### Tabs Not Opening

If tabs aren't opening when dispatching actions:
1. Verify the `parentTabId` matches between the action and the wrapper
2. Check that the wrapper is initialized (visible on screen)
3. Ensure `singleton: true` tabs don't already exist

### State Not Updating

If tab state seems stale:
1. Use NgRx DevTools to verify actions are dispatched
2. Check that selectors are using the correct `parentTabId`
3. Verify signals are properly initialized in `ngOnInit`
