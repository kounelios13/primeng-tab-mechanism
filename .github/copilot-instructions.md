# Copilot Instructions for PrimeNG Tab Mechanism Project

## Project Overview
This is an Angular 19 standalone application implementing a sophisticated nested tab system with PrimeNG and NgRx. The project uses **Angular Signals**, **OnPush change detection**, and modern patterns throughout.

## Architecture & Key Conventions

### Angular 19 Modern Patterns
- **Standalone Components**: No NgModules, all components use `imports` array
- **Angular Signals**: `toSignal()` for reactive state from NgRx store
- **OnPush Change Detection**: All components use `ChangeDetectionStrategy.OnPush`
- **New Control Flow**: `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`
- **New Tabs API**: Using `p-tabs`, `p-tablist`, `p-tab`, `p-tabpanels`, `p-tabpanel`

### Project Structure
```
src/app/
├── store/                       # NgRx state management
│   ├── tab.actions.ts           # Main tab actions
│   ├── tab.reducer.ts           # Main tab reducer
│   ├── tab.selectors.ts         # Main tab selectors
│   ├── inner-tab.actions.ts     # Inner tab actions + InnerTabComponentType enum
│   ├── inner-tab.reducer.ts     # Inner tab reducer
│   ├── inner-tab.selectors.ts   # Inner tab selectors
│   └── index.ts                 # Store exports
├── shared/
│   ├── constants.ts             # PARENT_TAB_IDS and type definitions
│   ├── base-tab-launcher.ts     # Abstract launcher base class (signals-based)
│   ├── tab-component-registry.ts # Maps enum to component classes
│   ├── inner-tab-container/     # Generic inner tab container
│   └── index.ts                 # Shared exports
├── components/
│   ├── tasks/                   # Tasks feature
│   │   ├── tasks.component.*    # Main tasks tab
│   │   ├── task-launcher/       # Tasks launcher (extends BaseTabLauncher)
│   │   ├── task-detail/         # Task detail inner tab
│   │   └── task-form/           # Task form inner tab
│   └── overview/                # Overview feature
│       ├── overview.component.* # Main overview tab
│       ├── overview-launcher/   # Overview launcher (extends BaseTabLauncher)
│       ├── overview-chart/      # Chart inner tab
│       └── overview-report/     # Report inner tab
└── tab-panel/                   # Main tab panel component
```

## Development Workflow

### Essential Commands
```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build
npm test           # Run tests
```

## Key Constants

### PARENT_TAB_IDS (`src/app/shared/constants.ts`)
Always use these constants instead of hardcoded strings:

```typescript
import { PARENT_TAB_IDS, ParentTabId } from '../shared';

// Usage
protected parentTabId = PARENT_TAB_IDS.TASKS;   // 'tasks'
protected parentTabId = PARENT_TAB_IDS.OVERVIEW; // 'overview'
```

## Angular Signals Pattern

### Converting Store Selectors to Signals
```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { inject, Signal } from '@angular/core';
import { Store } from '@ngrx/store';

export class MyComponent {
  private store = inject(Store);

  // Signal from store selector
  readonly tabs: Signal<TabItem[]> = toSignal(
    this.store.select(selectAllTabs),
    { initialValue: [] }
  );

  // Usage in template: {{ tabs().length }}
  // Usage in code: const count = this.tabs().length;
}
```

### Lazy Signal Initialization (for abstract classes)
When `parentTabId` is abstract and set by subclass:

```typescript
private _currentTabs?: Signal<InnerTabItem[]>;

protected get currentTabs(): Signal<InnerTabItem[]> {
  if (!this._currentTabs) {
    this._currentTabs = toSignal(
      this.store.select(selectInnerTabs(this.parentTabId)),
      { initialValue: [] }
    );
  }
  return this._currentTabs;
}

// Usage: this.currentTabs() - with parentheses!
```

## PrimeNG New Tabs API

### Structure
```html
<p-tabs [value]="activeTabId()" (valueChange)="onTabValueChange($any($event))">
  <p-tablist>
    @for (tab of tabs(); track tab.id) {
      <p-tab [value]="tab.id">{{ tab.title }}</p-tab>
    }
  </p-tablist>
  <p-tabpanels>
    @for (tab of tabs(); track tab.id) {
      <p-tabpanel [value]="tab.id">{{ tab.content }}</p-tabpanel>
    }
  </p-tabpanels>
</p-tabs>
```

### Key Differences from Deprecated TabView
| Old (TabView) | New (Tabs) |
|---------------|------------|
| `[(activeIndex)]` | `[value]` (string/number ID) |
| `(activeIndexChange)` | `(valueChange)` |
| `<p-tabView>` | `<p-tabs>` |
| `<p-tabPanel header="">` | `<p-tab>` + `<p-tabpanel>` |

## Nested Tab System

### Architecture Overview
```
TabPanelComponent (main tabs)
├── TasksComponent → InnerTabContainerComponent
│   ├── TaskLauncherComponent (static, non-closable)
│   ├── TaskDetailComponent (dynamic, closable)
│   └── TaskFormComponent (dynamic, closable)
└── OverviewComponent → InnerTabContainerComponent
    ├── OverviewLauncherComponent (static, non-closable)
    ├── OverviewChartComponent (dynamic, closable)
    └── OverviewReportComponent (dynamic, closable)
```

### BaseTabLauncher (Abstract Base Class)

All launcher components extend this:

```typescript
import { PARENT_TAB_IDS } from '../../../shared';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class TaskLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.TASKS;

  // currentTabs is a Signal - use () to access value
  protected override canOpenTab(
    componentType: InnerTabComponentType,
    config: InnerTabConfig
  ): boolean {
    if (componentType === InnerTabComponentType.TaskDetail) {
      return this.currentTabs().filter(
        t => t.componentType === componentType
      ).length < 5;
    }
    return true;
  }

  openNewTask(): void {
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
}
```

### Available BaseTabLauncher Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `openInnerTab(config)` | `boolean` | Opens new tab, handles singleton logic |
| `focusExistingTab(id)` | `void` | Activates an existing tab |
| `closeInnerTab(id)` | `void` | Closes a tab |
| `findTabById(id)` | `InnerTabItem?` | Find tab by ID |
| `findTabByType(type)` | `InnerTabItem?` | Find tab by component type |
| `isTabTypeOpen(type)` | `boolean` | Check if type is open |
| `generateTabId(prefix)` | `string` | Generate unique ID |
| `currentTabs` | `Signal<InnerTabItem[]>` | Signal of current tabs |

### Singleton Tab Pattern

```typescript
// Only one instance allowed
this.openInnerTab({
  id: 'task-new-form',
  singleton: true,  // Will focus existing if already open
  // ...
});

// Unique by ID (multiple details, but one per task)
const existingTab = this.findTabById(`task-detail-${taskId}`);
if (existingTab) {
  this.focusExistingTab(existingTab.id);
  return;
}
this.openInnerTab({ id: `task-detail-${taskId}`, ... });
```

### InnerTabComponentType Enum

```typescript
export enum InnerTabComponentType {
  TaskLauncher = 'task-launcher',
  TaskDetail = 'task-detail',
  TaskForm = 'task-form',
  OverviewLauncher = 'overview-launcher',
  OverviewChart = 'overview-chart',
  OverviewReport = 'overview-report',
  GenericLauncher = 'generic-launcher',
  Settings = 'settings'
}
```

### Adding New Inner Tab Features

1. **Add to Enum**: `InnerTabComponentType` in `inner-tab.actions.ts`
2. **Create Component**: With `@Input() tabData`, `@Input() tabId`, `@Input() parentTabId`
3. **Register**: Add to `TAB_COMPONENT_REGISTRY` in `tab-component-registry.ts`
4. **Use**: Call `this.openInnerTab()` from launcher

## Inner Tab Store Actions

```typescript
InnerTabActions.initContext({ parentTabId, launcherTab })
InnerTabActions.addInnerTab({ parentTabId, tab })
InnerTabActions.removeInnerTab({ parentTabId, tabId })
InnerTabActions.setActiveInnerTab({ parentTabId, tabId })
InnerTabActions.updateInnerTab({ parentTabId, tabId, updates })
InnerTabActions.clearContext({ parentTabId })
```

## Component Template Pattern

```typescript
@Component({
  selector: 'app-feature',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './feature.component.html',
  styleUrl: './feature.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush  // Always use!
})
export class FeatureComponent {
  private store = inject(Store);
  
  // Signals instead of observables
  readonly data = toSignal(this.store.select(selectData), { initialValue: [] });
}
```

## Template Pattern

```html
<!-- Use signals with () -->
@if (data().length > 0) {
  @for (item of data(); track item.id) {
    <div>{{ item.name }}</div>
  }
}

<!-- Switch for tab content routing -->
@switch (tab.id) {
  @case (PARENT_TAB_IDS.TASKS) {
    <app-tasks></app-tasks>
  }
  @case (PARENT_TAB_IDS.OVERVIEW) {
    <app-overview></app-overview>
  }
}
```

## Theme Configuration

```typescript
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({ theme: { preset: Aura } }),
    provideStore({
      [tabFeature.name]: tabFeature.reducer,
      [innerTabFeature.name]: innerTabFeature.reducer
    }),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ]
};
```

## Performance Best Practices

1. **Always use OnPush**: `changeDetection: ChangeDetectionStrategy.OnPush`
2. **Use Signals**: Replace `async` pipe with `toSignal()`
3. **Track items**: Always use `track` in `@for` loops
4. **Lazy loading**: Heavy tab content should load on demand
5. **Constants over strings**: Use `PARENT_TAB_IDS` instead of `'tasks'`
