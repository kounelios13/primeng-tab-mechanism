# Architecture & Design Decisions

This document explains the architecture of the PrimeNG Tab Mechanism project, the design patterns
it employs, and the reasoning behind every significant decision.  It was written as part of the
refactoring pass in March 2026 and supersedes the older `IMPLEMENTATION_SUMMARY.md` and
`SIMPLIFICATION_SUMMARY.md` files at the repository root.

---

## Table of Contents

1. [High-level Overview](#1-high-level-overview)
2. [Technology Choices](#2-technology-choices)
3. [Component Architecture](#3-component-architecture)
4. [State Management (NgRx)](#4-state-management-ngrx)
5. [Design Patterns in Use](#5-design-patterns-in-use)
6. [Key Refactoring Decisions (March 2026)](#6-key-refactoring-decisions-march-2026)
7. [Data Flow Walkthrough](#7-data-flow-walkthrough)
8. [Adding a New Feature Tab](#8-adding-a-new-feature-tab)
9. [Known Limitations & Future Work](#9-known-limitations--future-work)

---

## 1. High-level Overview

The application is a multi-level tab system.

```
AppComponent
└── TabPanelComponent            ← top-level sidebar navigation
    ├── TasksComponent           ← wrapper for the Tasks context
    │   ├── TaskDetailComponent  ← inner tab content
    │   └── TaskFormComponent    ← inner tab content
    ├── OverviewComponent        ← wrapper for the Overview context
    │   ├── OverviewChartComponent
    │   └── OverviewReportComponent
    └── ProjectsComponent        ← wrapper for the Projects context
        ├── ProjectDetailComponent
        └── ProjectSettingsComponent
```

**Main tabs** (Tasks, Overview, Projects) are permanent navigation sections displayed in the
left sidebar.  Each main tab hosts an unlimited number of **inner tabs** that the user can open,
switch between, and close.

---

## 2. Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Angular 19 (Standalone) | No NgModules; `imports` array keeps each component self-contained |
| State | NgRx 19 | Predictable, immutable state; great DevTools support |
| Reactivity | Angular Signals + `toSignal` | Zero-boilerplate subscriptions; automatic cleanup via `DestroyRef` |
| UI Components | PrimeNG 19 (new Tabs API) | Modern `p-tabs` / `p-tablist` / `p-tabpanel` API instead of the deprecated `p-tabView` |
| Styling | SCSS | Shared base styles via `base-tab-wrapper.scss` |

---

## 3. Component Architecture

### 3.1 `TabPanelComponent`

The top-level shell.  It reads `tabs` and `activeTabId` from the NgRx store via signals, and
renders a PrimeNG `<p-tabs>` with a collapsible left sidebar.  Tab switching dispatches
`TabActions.setActiveTab`.

### 3.2 `BaseTabWrapper<TComponentType>` (abstract)

`src/app/shared/base-tab-wrapper.ts`

The central abstraction.  All feature wrapper components (`TasksComponent`, `OverviewComponent`,
`ProjectsComponent`) extend this class and share its template and styles.

**Responsibilities:**
- Initialising the NgRx inner-tab context on `ngOnInit`
- Subscribing (via signals) to the relevant slice of inner-tab state
- Processing pending tab-open requests via a reactive `effect`
- Providing a clean public API (`openInnerTab`, `closeInnerTab`, `focusExistingTab`, …)
- Rendering the shared `base-tab-wrapper.html` template, including dynamic component loading
  via `ngComponentOutlet`
- Cleaning up the NgRx context on `ngOnDestroy`

**What child classes must provide:**
```typescript
abstract readonly parentTabId: ParentTabId;
abstract readonly componentRegistry: ComponentRegistry;
```

**What child classes may optionally override:**
```typescript
readonly initialTabs: InnerTabItem[] = [];   // tabs opened automatically on init

protected canOpenTab(                        // Template Method hook for validation
  componentType: TComponentType,
  config: InnerTabConfig
): boolean { return true; }
```

### 3.3 Feature Wrapper Components

`TasksComponent`, `OverviewComponent`, `ProjectsComponent` are thin configuration shells:

```typescript
@Component({
  templateUrl: '../../shared/base-tab-wrapper.html',
  styleUrl: '../../shared/base-tab-wrapper.scss'
})
export class TasksComponent extends BaseTabWrapper<InnerTabComponentType> {
  readonly parentTabId = PARENT_TAB_IDS.TASKS;

  readonly componentRegistry: ComponentRegistry = new Map([
    [InnerTabComponentType.TaskDetail, TaskDetailComponent],
    [InnerTabComponentType.TaskForm,   TaskFormComponent],
  ]);

  readonly initialTabs: InnerTabItem[] = [ /* ... */ ];

  // Optional domain-specific methods
  openTaskDetail(taskId: string, title: string): void { /* ... */ }
}
```

The template and styles are not duplicated – both files are declared once in `shared/` and
referenced by all wrappers.

### 3.4 Inner Tab Content Components

`TaskDetailComponent`, `TaskFormComponent`, etc. are the actual content rendered inside each
inner tab.  They implement the `IInnerTabComponent` interface:

```typescript
export interface IInnerTabComponent {
  tabData?:    Record<string, unknown>;  // payload forwarded from tab config
  tabId?:      string;                   // unique ID of this tab instance
  parentTabId?: string;                  // parent context ID
}
```

`BaseTabWrapper` passes all three inputs automatically via `ngComponentOutlet`:

```html
<ng-container *ngComponentOutlet="
  component;
  inputs: { tabData: tab.data, tabId: tab.id, parentTabId: tab.parentTabId }
"></ng-container>
```

---

## 4. State Management (NgRx)

### 4.1 Main Tab State (`tabs` feature)

```
TabState
  tabs: TabItem[]       – array of top-level tab descriptors
  activeTabId: string | null
```

Actions: `addTab`, `removeTab`, `setActiveTab`, `updateTab`.

### 4.2 Inner Tab State (`innerTabs` feature)

```
InnerTabState
  contexts: Record<string, InnerTabContextState>
    [parentTabId]:
      innerTabs:         InnerTabItem[]
      activeInnerTabId:  string | null
  pendingRequests: TabRequest[]
```

`contexts` is a map keyed by `parentTabId` (`'tasks'`, `'overview'`, `'projects'`).  This
cleanly separates state between features.

### 4.3 Request-based Tab Opening

Inner tab content components (e.g. `TaskDetailComponent`) may need to open new tabs without
having a direct reference to the parent wrapper.  They achieve this by dispatching
`requestAddInnerTab`:

```
Inner component  →  requestAddInnerTab  →  pendingRequests[]
                                                  ↓
                              BaseTabWrapper effect processes request
                                                  ↓
                                         addInnerTab  →  contexts[parentTabId]
```

This decouples content components from their parent wrapper while still routing requests
through a single processing point.

**Deduplication:** The reducer checks for `(parentTabId, tab.id)` pairs before adding to
`pendingRequests`, preventing duplicate requests from creating duplicate tabs.

### 4.4 Selectors

All selectors are factory functions that take a `parentTabId` argument to scope results to one
context, e.g.:

```typescript
const tasks$ = store.select(selectInnerTabs(PARENT_TAB_IDS.TASKS));
```

This avoids having to maintain separate selectors per feature.

---

## 5. Design Patterns in Use

### 5.1 Template Method Pattern

`BaseTabWrapper.canOpenTab()` is a hook that subclasses override to add domain-specific
validation without changing the base class tab-opening flow:

```typescript
// BaseTabWrapper
openInnerTab(config: InnerTabConfig): boolean {
  if (!this.canOpenTab(config.componentType as TComponentType, config)) return false;
  // ... dispatch
}

// In TasksComponent
protected override canOpenTab(type, config): boolean {
  if (type === InnerTabComponentType.TaskDetail) {
    return this.innerTabs().filter(t => t.componentType === type).length < 5;
  }
  return true;
}
```

### 5.2 Registry / Factory Pattern

`ComponentRegistry = Map<string | number | undefined, Type<unknown>>` maps an enum value to an
Angular component class.  `BaseTabWrapper.getComponent(tab)` resolves the component at runtime,
enabling fully dynamic tab content without a `@switch` statement:

```typescript
getComponent(tab: InnerTabItem): Type<unknown> | undefined {
  return this.componentRegistry.get(tab.componentType);
}
```

New content components are registered once in the wrapper, and the base class handles the rest.

### 5.3 Singleton Tab Pattern

Tabs marked `singleton: true` in their config are checked before dispatch:

```typescript
if (config.singleton) {
  const existing = tabs.find(t => t.componentType === config.componentType);
  if (existing) { this.focusExistingTab(existing.id); return false; }
}
```

Tabs that should be unique by *instance* (e.g. one detail view per task) use a stable, derived
ID (`task-detail-${taskId}`) and are deduplicated by `findTabById` before dispatching.

### 5.4 Signal-based Reactivity

`toSignal` converts NgRx observable selectors to Angular Signals.  Using the component-level
`Injector` (injected in the constructor) ensures subscriptions are cleaned up when the
component is destroyed:

```typescript
private injector = inject(Injector);

this.innerTabs = toSignal(
  this.store.select(selectInnerTabs(this.parentTabId)),
  { initialValue: [], injector: this.injector }
);
```

Templates consume signals with `()`:
```html
@for (tab of innerTabs(); track tab.id) { ... }
```

---

## 6. Key Refactoring Decisions (March 2026)

### 6.1 `parentTabId` now passed to inner tab components

**Problem:** `base-tab-wrapper.html` used `ngComponentOutlet` to load inner components but only
passed `tabData` and `tabId`.  The `parentTabId` input on inner components was always
`undefined`, preventing them from knowing their own context.

**Fix:** Added `parentTabId: tab.parentTabId` to the `ngComponentOutlet` inputs:
```html
<ng-container *ngComponentOutlet="
  component;
  inputs: { tabData: tab.data, tabId: tab.id, parentTabId: tab.parentTabId }
"></ng-container>
```

### 6.2 `TaskDetailComponent` no longer hard-codes its parent context

**Problem:** `TaskDetailComponent.openEditForm()` dispatched with the hard-coded constant
`PARENT_TAB_IDS.TASKS`, coupling the component to a specific context and making it impossible
to reuse in other feature tabs.

**Fix:** The method now reads from `this.parentTabId` (which is populated via fix 6.1) and
falls back to the constant only as a safety net:

```typescript
openEditForm(): void {
  const parentTabId = this.parentTabId ?? PARENT_TAB_IDS.TASKS;
  this.store.dispatch(InnerTabActions.requestAddInnerTab({ parentTabId, tab: { ... } }));
}
```

### 6.3 `IInnerTabComponent` interface introduced

All inner tab content components now explicitly `implements IInnerTabComponent`.  This makes the
contract between the wrapper and content components explicit and gives TypeScript compile-time
feedback when a new component forgets to declare the required inputs.

```typescript
export interface IInnerTabComponent {
  tabData?:     Record<string, unknown>;
  tabId?:       string;
  parentTabId?: string;
}
```

### 6.4 Signals and effects use component-level `Injector`

**Problem (before):** `toSignal` was called with `injector: this.environmentInjector`
(`EnvironmentInjector`).  This tied the Observable subscription to the *application* lifetime,
meaning subscriptions were never cleaned up when the wrapper component was destroyed.

**Fix:** `inject(Injector)` in the constructor returns the component's `ElementInjector`.
Passing it to `toSignal` (and the effect) ties their lifetimes to the component:

```typescript
private injector = inject(Injector);

ngOnInit(): void {
  this.innerTabs = toSignal(..., { injector: this.injector });
  effect(() => { ... }, { injector: this.injector });
}
```

### 6.5 Effect moved from constructor to `ngOnInit`

**Problem (before):** The `effect()` was created in the constructor, before `ngOnInit` had
initialised the `pendingRequests` signal.  The code guarded against this with
`if (this.pendingRequests)`, but the guard is fragile: if the effect ran before `ngOnInit`,
no signal dependency was tracked and the effect would never re-run.

**Root cause:** `parentTabId` is an abstract field set by the child class.  It is not yet
available in the *parent* constructor body because TypeScript child-class field initialisers run
*after* `super()` returns.  By the time `ngOnInit` executes, all constructors have completed
and `parentTabId` is guaranteed to be set.

**Fix:** Signals and the effect are all initialised in `ngOnInit`, in dependency order:

```typescript
ngOnInit(): void {
  // 1. Initialise signals (parentTabId is available)
  this.pendingRequests = toSignal(..., { injector: this.injector });

  // 2. Create effect (pendingRequests signal is now defined)
  effect(() => {
    const requests = this.pendingRequests();
    requests.forEach(r => this.handleTabRequest(r));
  }, { injector: this.injector });

  // 3. Bootstrap context
  this.initializeContext();
}
```

### 6.6 `processedRequestIds` removed

**Problem (before):** A `Set<string>` was maintained to prevent an effect from processing the
same request twice.  This added state and complex cleanup logic.

**Why it is unnecessary now:** Angular effects run to completion before being re-run.
`handleTabRequest` dispatches `addInnerTab` which removes the entry from `pendingRequests`
synchronously (NgRx reducers are synchronous).  By the time the effect is eligible to re-run,
the processed request is already gone from the array.  No double-processing can occur.

### 6.7 Duplicate `setActiveInnerTab` method removed

**Problem:** `BaseTabWrapper` had two public methods with identical implementations:
`focusExistingTab(tabId)` and `setActiveInnerTab(tabId)`.  This caused confusion about which
one to call.

**Fix:** `setActiveInnerTab` was removed.  `focusExistingTab` is the single, semantically clear
public API.  Internal callers (`onTabValueChange`, `openInnerTab`) dispatch directly.

### 6.8 `ngOnDestroy` added to `BaseTabWrapper`

`BaseTabWrapper` now dispatches `clearContext` when the component is destroyed, preventing stale
inner-tab state from accumulating if the component is ever recreated (e.g. after a route
navigation that remounts the component tree).

---

## 7. Data Flow Walkthrough

### Opening a tab from a wrapper method

```
User clicks "New Task"
  → TasksComponent.openNewTaskForm()
  → BaseTabWrapper.openInnerTab({ singleton: true, ... })
      → singleton check passes (no existing tab)
      → canOpenTab hook passes
      → dispatch requestAddInnerTab
          → reducer adds to pendingRequests
          → pendingRequests signal changes
  → effect runs
      → handleTabRequest dispatches addInnerTab
          → reducer adds tab to contexts['tasks'], sets activeInnerTabId
          → removes entry from pendingRequests
          → innerTabs / activeTabId signals update
  → template re-renders with new tab
```

### Opening a tab from an inner component

```
User clicks "Edit" in TaskDetailComponent
  → TaskDetailComponent.openEditForm()
      → reads this.parentTabId (injected by BaseTabWrapper via ngComponentOutlet)
      → dispatch requestAddInnerTab({ parentTabId: 'tasks', tab: { ... } })
  (same flow as above from "reducer adds to pendingRequests")
```

---

## 8. Adding a New Feature Tab

### Step 1 – Register the parent tab ID

`src/app/shared/constants.ts`:
```typescript
export const PARENT_TAB_IDS = {
  TASKS:    'tasks',
  OVERVIEW: 'overview',
  PROJECTS: 'projects',
  REPORTS:  'reports',   // ← add here
} as const;
```

Also add to `ALL_PARENT_TAB_IDS` and to the initial state in `tab.reducer.ts`.

### Step 2 – Add component types to the enum

`src/app/store/inner-tab.actions.ts`:
```typescript
export enum InnerTabComponentType {
  // ...existing...
  ReportDetail  = 'report-detail',
  ReportExport  = 'report-export',
}
```

### Step 3 – Create inner tab content components

```typescript
@Component({ selector: 'app-report-detail', ... })
export class ReportDetailComponent implements OnInit, IInnerTabComponent {
  @Input() tabData?:     Record<string, unknown>;
  @Input() tabId?:       string;
  @Input() parentTabId?: string;
  // ... component logic
}
```

### Step 4 – Create the wrapper component

```typescript
@Component({
  selector: 'app-reports',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: '../../shared/base-tab-wrapper.html',
  styleUrl:    '../../shared/base-tab-wrapper.scss',
})
export class ReportsComponent extends BaseTabWrapper<InnerTabComponentType> {
  readonly parentTabId = PARENT_TAB_IDS.REPORTS;

  readonly componentRegistry: ComponentRegistry = new Map([
    [InnerTabComponentType.ReportDetail, ReportDetailComponent],
    [InnerTabComponentType.ReportExport, ReportExportComponent],
  ]);
}
```

### Step 5 – Register in `TabPanelComponent`

Add `ReportsComponent` to the `imports` array and add a `@case` in the template:

```html
@case (PARENT_TAB_IDS.REPORTS) {
  <app-reports></app-reports>
}
```

---

## 9. Known Limitations & Future Work

### `canOpenTab` not applied to requests from inner components

When an inner component dispatches `requestAddInnerTab` directly, the pending-request effect
calls `handleTabRequest → dispatch addInnerTab` *without* going through `canOpenTab`.  This
means the tab-count limit defined in `canOpenTab` can be bypassed by inner components.

**Suggested fix:** `handleTabRequest` should call `openInnerTab` (which runs `canOpenTab`)
instead of dispatching `addInnerTab` directly.  However, `openInnerTab` uses
`requestAddInnerTab` internally which would create an infinite loop.  The resolution requires
introducing a separate `'Reject Tab Request'` action in the reducer that removes a pending
request without adding a tab.

### `initialTabs` include redundant `parentTabId`

The `initialTabs` array on wrapper components requires each entry to repeat `parentTabId`:
```typescript
{ id: 'task-detail-1', parentTabId: PARENT_TAB_IDS.TASKS, ... }
```
`initializeContext` already injects the correct `parentTabId` before dispatching, so the field
in the array is overwritten.  A future improvement would be to type `initialTabs` as
`InnerTabConfig[]` (which omits `parentTabId`) to eliminate this redundancy.

### No persistence layer

Tab state is held in memory only.  Refreshing the page resets all inner tabs to their initial
state.  A future enhancement could use NgRx `meta-reducers` with `localStorage` serialisation
to persist the active context across sessions.

### PrimeNG `Dropdown` and `Calendar` deprecation warnings

`TaskFormComponent` uses `p-dropdown` and `p-calendar`, which PrimeNG deprecated in v18 in
favour of `p-select` and `p-datepicker`.  The project currently uses PrimeNG 19 where these
components still work but emit deprecation warnings.  These can be migrated without
architectural changes; the warnings do not affect functionality.
