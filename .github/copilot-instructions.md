# Copilot Instructions for PrimeNG Tab Mechanism Project

## Project Overview
This is an Angular 19 standalone application designed to implement and experiment with PrimeNG tab functionality. The project uses the latest Angular features including standalone components and modern build tools. PrimeNG 19 and PrimeIcons are installed and configured.

## Architecture & Key Conventions

### Angular 19 Standalone Architecture
- **No NgModules**: This project uses standalone components exclusively
- **Component Structure**: Components use `imports` array instead of module declarations
- **Bootstrap**: Application bootstrapped via `bootstrapApplication()` in `main.ts`
- **Routing**: Uses function-based routing with `provideRouter()` in `app.config.ts`

### Project Structure
```
src/app/
├── app.component.*     # Root component (standalone)
├── app.config.ts       # Application configuration & providers
└── app.routes.ts       # Routing configuration
```

## Development Workflow

### Essential Commands
```bash
# Development server (runs on http://localhost:4200)
npm start
ng serve

# Build for production
npm run build
ng build

# Run tests
npm test
ng test

# Generate components (will be standalone by default)
ng generate component <name>
```

### Code Generation Patterns
- **Components**: Always generated as standalone (`ng g c component-name`)
- **Styling**: Project uses SCSS (configured in angular.json)
- **Prefix**: Components use `app-` prefix (configured in angular.json)

## PrimeNG Integration ✅ Installed

### Current Setup:
- **PrimeNG 19**: Installed and compatible with Angular 19
- **PrimeNG Themes**: @primeng/themes package installed (configured via providers, not CSS)
- **PrimeIcons**: Installed for icon support
- **Styling**: Modern theme system using JavaScript configuration
- **NgRx 19**: Store, Effects, and DevTools configured for state management

### Using PrimeNG Components:
```typescript
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [CommonModule, TabViewModule, ButtonModule],
  template: `
    <p-tabView>
      <p-tabPanel header="Tab 1">Content 1</p-tabPanel>
      <p-tabPanel header="Tab 2">Content 2</p-tabPanel>
    </p-tabView>
  `
})
```

### Tab Implementation Patterns

#### Basic Static Tabs:
```html
<p-tabView>
  <p-tabPanel header="Overview" leftIcon="pi pi-info-circle">
    <p>Overview content here</p>
  </p-tabPanel>
  <p-tabPanel header="Details" leftIcon="pi pi-list">
    <p>Details content here</p>
  </p-tabPanel>
</p-tabView>
```

#### Dynamic Tabs:
```typescript
tabs = [
  { title: 'Tab 1', content: 'Content 1', icon: 'pi pi-home' },
  { title: 'Tab 2', content: 'Content 2', icon: 'pi pi-user', disabled: false }
];
```

```html
<p-tabView (onChange)="onTabChange($event)">
  <p-tabPanel 
    *ngFor="let tab of tabs" 
    [header]="tab.title" 
    [leftIcon]="tab.icon"
    [disabled]="tab.disabled">
    {{ tab.content }}
  </p-tabPanel>
</p-tabView>
```

## State Management with NgRx ✅ Configured

### Tab State Structure:
```typescript
interface TabItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  disabled?: boolean;
  closable?: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeTabId: string | null;
}
```

### Using Tab State in Components:
```typescript
import { Store } from '@ngrx/store';
import { selectAllTabs, selectActiveTab, TabActions } from './store';

@Component({
  // ...
})
export class TabComponent {
  tabs$ = this.store.select(selectAllTabs);
  activeTab$ = this.store.select(selectActiveTab);

  constructor(private store: Store) {}

  onTabChange(event: any) {
    const tabId = this.tabs[event.index].id;
    this.store.dispatch(TabActions.setActiveTab({ id: tabId }));
  }

  addNewTab() {
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      content: 'New tab content'
    };
    this.store.dispatch(TabActions.addTab({ tab: newTab }));
  }
}
```

### Available Actions:
- `TabActions.addTab({ tab })` - Add a new tab
- `TabActions.removeTab({ id })` - Remove a tab by ID
- `TabActions.setActiveTab({ id })` - Set the active tab
- `TabActions.updateTab({ id, updates })` - Update tab properties

### Store Structure:
- **State**: `src/app/store/tab.reducer.ts`
- **Actions**: `src/app/store/tab.actions.ts`
- **Selectors**: `src/app/store/tab.selectors.ts`
- **DevTools**: Enabled in development mode

## Nested/Inner Tab System ✅ Implemented

The project features a reusable nested tab architecture where main tabs (like Tasks, Overview) contain their own inner tab systems. This is managed through NgRx store and a component registry pattern.

### Architecture Overview:
```
Main Tabs (TabPanel)
└── Tasks Tab
    └── InnerTabContainerComponent
        ├── TaskLauncherComponent (static, non-closable)
        ├── TaskDetailComponent (dynamic, closable)
        └── TaskFormComponent (dynamic, closable)
└── Overview Tab
    └── InnerTabContainerComponent
        ├── OverviewLauncherComponent (static, non-closable)
        ├── OverviewChartComponent (dynamic, closable)
        └── OverviewReportComponent (dynamic, closable)
```

### Key Components:

#### 1. InnerTabContainerComponent
Generic, reusable container for inner tabs. Located at `src/app/shared/inner-tab-container/`.

```html
<app-inner-tab-container
  [parentTabId]="'tasks'"
  [launcherComponent]="TaskLauncherComponent"
  [launcherComponentType]="InnerTabComponentType.TaskLauncher"
  [launcherTitle]="'Task Home'"
  [launcherIcon]="'pi pi-home'">
</app-inner-tab-container>
```

#### 2. BaseTabLauncher Abstract Class
Base class for all launcher components. Located at `src/app/shared/base-tab-launcher.ts`.

Features:
- Store-synced tab state via `currentTabs` property
- `canOpenTab()` method for custom validation (override in subclasses)
- `isTabTypeOpen()` and `findTabByType()` for checking existing tabs
- `focusExistingTab()` to navigate to an existing tab
- `singleton` property support for single-instance tabs

```typescript
export class TaskLauncherComponent extends BaseTabLauncher {
  protected parentTabId = 'tasks';
  
  // Override for custom validation logic
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    // Example: Limit TaskDetail tabs to 5
    if (componentType === InnerTabComponentType.TaskDetail) {
      return this.currentTabs.filter(t => t.componentType === componentType).length < 5;
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
      singleton: true,  // Only one instance can be open
      data: { mode: 'create' }
    });
  }
}
```

### Singleton Tab Pattern
Tabs can be configured to only allow one instance at a time:

```typescript
// In InnerTabConfig
singleton?: boolean;  // If true, only one instance can exist

// Usage patterns:
// 1. Singleton by type (only one "New Task" form)
this.openInnerTab({
  id: 'task-new-form',
  componentType: InnerTabComponentType.TaskForm,
  singleton: true,  // Will focus existing if already open
  ...
});

// 2. Unique by ID (one detail per task, but multiple details allowed)
const existingTab = this.findTabById(`task-detail-${taskId}`);
if (existingTab) {
  this.focusExistingTab(existingTab.id);
  return;
}
this.openInnerTab({ id: `task-detail-${taskId}`, ... });

// 3. Custom validation via canOpenTab override
protected override canOpenTab(componentType, config): boolean {
  // Limit number of tabs, check permissions, etc.
  return true;
}
```

#### 3. Tab Component Registry
Maps component types to Angular components. Located at `src/app/shared/tab-component-registry.ts`.

```typescript
export const TAB_COMPONENT_REGISTRY: Partial<Record<InnerTabComponentType, Type<unknown>>> = {
  [InnerTabComponentType.TaskLauncher]: TaskLauncherComponent,
  [InnerTabComponentType.TaskDetail]: TaskDetailComponent,
  [InnerTabComponentType.TaskForm]: TaskFormComponent,
  [InnerTabComponentType.OverviewLauncher]: OverviewLauncherComponent,
  [InnerTabComponentType.OverviewChart]: OverviewChartComponent,
  [InnerTabComponentType.OverviewReport]: OverviewReportComponent,
};
```

### InnerTabComponentType Enum
All inner tab component types are defined in `src/app/store/inner-tab.actions.ts`:

```typescript
export enum InnerTabComponentType {
  // Task-related inner tabs
  TaskLauncher = 'task-launcher',
  TaskDetail = 'task-detail',
  TaskForm = 'task-form',
  
  // Overview-related inner tabs
  OverviewLauncher = 'overview-launcher',
  OverviewChart = 'overview-chart',
  OverviewReport = 'overview-report',
  
  // Generic/shared inner tabs
  GenericLauncher = 'generic-launcher',
  Settings = 'settings'
}
```

### Inner Tab Store Actions:
- `InnerTabActions.initContext({ parentTabId, launcherTab })` - Initialize inner tab context
- `InnerTabActions.addInnerTab({ parentTabId, tab })` - Add a new inner tab
- `InnerTabActions.removeInnerTab({ parentTabId, tabId })` - Remove an inner tab
- `InnerTabActions.setActiveInnerTab({ parentTabId, tabId })` - Set active inner tab
- `InnerTabActions.clearContext({ parentTabId })` - Clear entire context

### Creating New Inner Tab Features:

1. **Add to Enum**: Add new type to `InnerTabComponentType` in `inner-tab.actions.ts`
2. **Create Component**: Create your component with `@Input() tabData` and `@Input() tabId`
3. **Register Component**: Add to `TAB_COMPONENT_REGISTRY` in `tab-component-registry.ts`
4. **Use in Launcher**: Call `this.openInnerTab()` from your launcher with the new type

### Project Structure:
```
src/app/
├── store/
│   ├── tab.actions.ts          # Main tab actions
│   ├── tab.reducer.ts          # Main tab reducer
│   ├── tab.selectors.ts        # Main tab selectors
│   ├── inner-tab.actions.ts    # Inner tab actions + enum
│   ├── inner-tab.reducer.ts    # Inner tab reducer
│   ├── inner-tab.selectors.ts  # Inner tab selectors
│   └── index.ts                # Store exports
├── shared/
│   ├── base-tab-launcher.ts    # Abstract launcher base class
│   ├── tab-component-registry.ts
│   └── inner-tab-container/    # Generic inner tab container
├── components/
│   ├── tasks/
│   │   ├── tasks.component.*   # Main tasks tab
│   │   ├── task-launcher/      # Tasks inner tab launcher
│   │   ├── task-detail/        # Task detail inner tab
│   │   └── task-form/          # Task form inner tab
│   └── overview/
│       ├── overview.component.* # Main overview tab
│       ├── overview-launcher/   # Overview inner tab launcher
│       ├── overview-chart/      # Chart inner tab
│       └── overview-report/     # Report inner tab
└── tab-panel/                   # Main tab panel component
```

## Testing Considerations
- **Karma + Jasmine**: Default testing setup
- **Component Testing**: Test tab switching behavior and dynamic content loading
- **Accessibility**: Ensure proper ARIA attributes for tab navigation

## Build Configuration
- **Bundle Size Limits**: 
  - Initial: 500kB warning, 1MB error
  - Component styles: 4kB warning, 8kB error
- **Source Maps**: Enabled in development
- **Output**: `dist/primeng-tab-mechanism/`

## Common Patterns to Follow

### Component Structure
```typescript
@Component({
  selector: 'app-feature',
  imports: [CommonModule, /* PrimeNG modules */],
  templateUrl: './feature.component.html',
  styleUrl: './feature.component.scss'
})
export class FeatureComponent {
  // Implementation
}
```

### Modern SCSS Imports (Use @use instead of @import)
```scss
@use 'primeicons/primeicons.css';
```

### Theme Configuration
PrimeNG 19 uses JavaScript-based themes configured via providers in `app.config.ts`:
```typescript
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({ theme: { preset: Aura } }),
    // other providers
  ]
};
```

### Tab Data Structure
```typescript
interface TabItem {
  header: string;
  content?: string;
  disabled?: boolean;
  closable?: boolean;
}
```

## Performance Notes
- Consider virtual scrolling for large numbers of tabs
- Implement lazy loading for heavy tab content
- Use OnPush change detection strategy for better performance
- Keep bundle size in mind when adding PrimeNG components