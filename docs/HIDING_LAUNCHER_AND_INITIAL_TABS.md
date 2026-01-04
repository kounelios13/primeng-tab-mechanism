# Hiding Launcher and Using Initial Tabs

This guide explains how to hide the launcher tab and open specific inner tabs automatically when a parent tab is activated.

## Overview

By default, the `InnerTabContainerComponent` creates a launcher tab as the first tab in each parent tab context. However, you can:

1. **Hide the launcher tab** by setting `showLauncher="false"`
2. **Open initial tabs automatically** by providing an `initialTabs` array
3. **Use both features together** to create a custom tab experience

## Use Cases

- **Dashboard-style tabs**: Open multiple related tabs automatically (charts, reports, etc.)
- **Project workspaces**: Pre-load project details, settings, and other relevant tabs
- **Multi-document interface**: Open recent documents automatically
- **Wizard-style workflows**: Pre-configure multiple steps as tabs

## Basic Configuration

### Option 1: Hide Launcher Only

Hide the launcher tab but keep the ability to open tabs dynamically:

```typescript
@Component({
  selector: 'app-my-feature',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.MYFEATURE"
      [launcherComponent]="MyLauncherComponent"
      [showLauncher]="false">
    </app-inner-tab-container>
  `
})
export class MyFeatureComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = MyLauncherComponent;
}
```

**Note**: Even though the launcher is hidden, the `launcherComponent` is still required because it provides the component registry for dynamic tab loading.

### Option 2: With Initial Tabs

Open specific tabs automatically when the parent tab loads:

```typescript
import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { MyLauncherComponent } from './my-launcher/my-launcher.component';
import { InnerTabComponentType, InnerTabItem } from '../../store';

@Component({
  selector: 'app-my-feature',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.MYFEATURE"
      [launcherComponent]="launcherComponent"
      [showLauncher]="false"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class MyFeatureComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = MyLauncherComponent;
  
  readonly initialTabs: InnerTabItem[] = [
    {
      id: 'dashboard',
      parentTabId: PARENT_TAB_IDS.MYFEATURE,
      title: 'Dashboard',
      componentType: InnerTabComponentType.MyDashboard,
      icon: 'pi pi-chart-bar',
      closable: true
    },
    {
      id: 'settings',
      parentTabId: PARENT_TAB_IDS.MYFEATURE,
      title: 'Settings',
      componentType: InnerTabComponentType.MySettings,
      icon: 'pi pi-cog',
      closable: true
    }
  ];
}
```

### Option 3: Launcher with Initial Tabs

Keep the launcher visible but also open initial tabs:

```typescript
@Component({
  selector: 'app-my-feature',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.MYFEATURE"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Home'"
      [showLauncher]="true"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class MyFeatureComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = MyLauncherComponent;
  
  // Tabs will open alongside the launcher
  readonly initialTabs: InnerTabItem[] = [
    // ... your tabs
  ];
}
```

## Complete Example: Projects Tab

Here's a real example from the Projects component showing how to hide the launcher and open three initial tabs:

### Step 1: Create the Component

```typescript
// src/app/components/projects/projects.component.ts

import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { ProjectLauncherComponent } from './project-launcher/project-launcher.component';
import { InnerTabComponentType, InnerTabItem } from '../../store';

@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.PROJECTS"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Projects Home'"
      [launcherIcon]="'pi pi-folder'"
      [showLauncher]="false"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class ProjectsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = ProjectLauncherComponent;
  
  readonly initialTabs: InnerTabItem[] = [
    {
      id: 'project-detail-1',
      parentTabId: PARENT_TAB_IDS.PROJECTS,
      title: 'Website Redesign',
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId: '1', projectName: 'Website Redesign' }
    },
    {
      id: 'project-detail-2',
      parentTabId: PARENT_TAB_IDS.PROJECTS,
      title: 'Mobile App Development',
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId: '2', projectName: 'Mobile App Development' }
    },
    {
      id: 'project-settings',
      parentTabId: PARENT_TAB_IDS.PROJECTS,
      title: 'Project Settings',
      componentType: InnerTabComponentType.ProjectSettings,
      icon: 'pi pi-cog',
      closable: true,
      data: { mode: 'settings' }
    }
  ];
}
```

### Step 2: Ensure Components are Registered

Make sure all component types used in `initialTabs` are registered in your launcher's component registry:

```typescript
// src/app/components/projects/project-launcher/project-launcher.component.ts

export class ProjectLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.PROJECTS;
  readonly componentType = InnerTabComponentType.ProjectLauncher;

  // Register all components that will be used
  override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
    [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
  ]);
}
```

## Dynamic Initial Tabs

You can dynamically generate initial tabs based on data:

```typescript
export class DocumentsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = DocumentLauncherComponent;
  
  // Load recent documents from service/state
  private recentDocuments = [
    { id: '1', name: 'Report.pdf' },
    { id: '2', name: 'Proposal.docx' },
    { id: '3', name: 'Budget.xlsx' }
  ];
  
  readonly initialTabs: InnerTabItem[] = this.recentDocuments.map(doc => ({
    id: `doc-${doc.id}`,
    parentTabId: PARENT_TAB_IDS.DOCUMENTS,
    title: doc.name,
    componentType: InnerTabComponentType.DocumentViewer,
    icon: 'pi pi-file',
    closable: true,
    data: { documentId: doc.id, documentName: doc.name }
  }));
}
```

## Using Signals for Dynamic Initial Tabs

For reactive initial tabs based on app state:

```typescript
import { Component, computed } from '@angular/core';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

export class DynamicTabsComponent {
  private store = inject(Store);
  
  // Get recent items from store as signal
  private recentItems = toSignal(
    this.store.select(selectRecentItems),
    { initialValue: [] }
  );
  
  // Compute initial tabs from signal
  readonly initialTabs = computed(() => 
    this.recentItems().map(item => ({
      id: `item-${item.id}`,
      parentTabId: PARENT_TAB_IDS.MYFEATURE,
      title: item.name,
      componentType: InnerTabComponentType.ItemDetail,
      icon: 'pi pi-file',
      closable: true,
      data: { itemId: item.id }
    }))
  );
}
```

## Important Notes

### Launcher Component Still Required

Even when `showLauncher="false"`, you must still provide a `launcherComponent`:

```typescript
// ✅ Correct - launcher component provided
<app-inner-tab-container
  [launcherComponent]="MyLauncherComponent"
  [showLauncher]="false"
  [initialTabs]="initialTabs">
</app-inner-tab-container>

// ❌ Wrong - will cause errors
<app-inner-tab-container
  [showLauncher]="false"
  [initialTabs]="initialTabs">
</app-inner-tab-container>
```

The launcher component is needed because:
1. It provides the component registry for loading dynamic tabs
2. It can still be used programmatically to open new tabs
3. It maintains consistency in the architecture

### Component Registry

All components referenced in `initialTabs` must be registered in the launcher's `componentRegistry`:

```typescript
export class MyLauncherComponent extends BaseTabLauncher {
  override componentRegistry = new Map([
    [InnerTabComponentType.Dashboard, DashboardComponent],  // ✅ Registered
    [InnerTabComponentType.Settings, SettingsComponent],     // ✅ Registered
    [InnerTabComponentType.Report, ReportComponent]          // ✅ Registered
  ]);
}

// In your parent component
readonly initialTabs: InnerTabItem[] = [
  {
    id: 'dashboard',
    componentType: InnerTabComponentType.Dashboard,  // ✅ Will work
    // ...
  },
  {
    id: 'unregistered',
    componentType: InnerTabComponentType.SomeOther,  // ❌ Not registered - will show error
    // ...
  }
];
```

### Tab IDs Must Be Unique

Each initial tab must have a unique ID:

```typescript
// ✅ Correct - unique IDs
readonly initialTabs: InnerTabItem[] = [
  { id: 'project-1', title: 'Project A', ... },
  { id: 'project-2', title: 'Project B', ... },
  { id: 'settings', title: 'Settings', ... }
];

// ❌ Wrong - duplicate IDs
readonly initialTabs: InnerTabItem[] = [
  { id: 'project', title: 'Project A', ... },
  { id: 'project', title: 'Project B', ... },  // Duplicate!
];
```

### Parent Tab ID

The `parentTabId` in each initial tab should match the container's `parentTabId`:

```typescript
// ✅ Correct
<app-inner-tab-container
  [parentTabId]="PARENT_TAB_IDS.PROJECTS"
  [initialTabs]="initialTabs">
</app-inner-tab-container>

readonly initialTabs: InnerTabItem[] = [
  {
    id: 'tab-1',
    parentTabId: PARENT_TAB_IDS.PROJECTS,  // ✅ Matches container
    // ...
  }
];

// ❌ Wrong - mismatched parent tab IDs
readonly initialTabs: InnerTabItem[] = [
  {
    id: 'tab-1',
    parentTabId: PARENT_TAB_IDS.TASKS,  // ❌ Doesn't match container
    // ...
  }
];
```

**Note**: The component automatically sets the correct `parentTabId` during initialization, but it's good practice to set it correctly for clarity.

## Combining with Dynamic Tab Opening

You can still open tabs dynamically even when using initial tabs:

```typescript
// Initial tabs are opened automatically
readonly initialTabs: InnerTabItem[] = [
  { id: 'dashboard', title: 'Dashboard', ... }
];

// User can still open more tabs from other components
openNewTab(): void {
  this.store.dispatch(InnerTabActions.requestAddInnerTab({
    parentTabId: PARENT_TAB_IDS.MYFEATURE,
    tab: {
      id: 'new-tab',
      title: 'New Tab',
      componentType: InnerTabComponentType.NewFeature,
      closable: true
    }
  }));
}
```

## Troubleshooting

### Initial Tabs Not Showing

**Problem**: Initial tabs don't appear when the parent tab is opened.

**Solutions**:
1. Verify components are registered in the launcher's `componentRegistry`
2. Check that `componentType` values match the registered types
3. Ensure `parentTabId` matches the container's parent tab ID
4. Check browser console for errors

### "Component not registered" Error

**Problem**: You see "Component not registered for type: X" in the tab content.

**Solution**: Add the component to your launcher's registry:

```typescript
override componentRegistry = new Map([
  [InnerTabComponentType.X, XComponent]  // Add this line
]);
```

### Launcher Still Shows

**Problem**: The launcher tab still appears even with `showLauncher="false"`.

**Solutions**:
1. Verify the binding syntax: `[showLauncher]="false"` (with brackets)
2. Check that you're passing a boolean, not a string: `false` not `"false"`
3. Clear browser cache and reload

### Initial Tabs Not Closable

**Problem**: Initial tabs cannot be closed.

**Solution**: Ensure `closable: true` is set in the tab configuration:

```typescript
readonly initialTabs: InnerTabItem[] = [
  {
    id: 'tab-1',
    title: 'My Tab',
    closable: true,  // ✅ Add this
    // ...
  }
];
```

## Best Practices

1. **Keep it simple**: Don't open too many initial tabs (2-4 is ideal)
2. **Use meaningful IDs**: Use descriptive IDs like `project-detail-1` instead of `tab1`
3. **Make tabs closable**: Unless there's a specific reason, allow users to close initial tabs
4. **Pass relevant data**: Use the `data` property to pass context to your tab components
5. **Consider performance**: Each tab component is initialized, so be mindful of heavy components
6. **Test thoroughly**: Verify that closing and reopening the parent tab works correctly

## Examples in the Repository

See these files for working examples:

- `src/app/components/projects/projects.component.ts` - Projects without launcher, with initial tabs
- `src/app/components/tasks/tasks.component.ts` - Tasks with launcher (traditional approach)
- `src/app/components/overview/overview.component.ts` - Overview with launcher (traditional approach)

## API Reference

### InnerTabContainerComponent Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `parentTabId` | `ParentTabId` | Required | ID of the parent tab context |
| `launcherComponent` | `Type<BaseTabLauncher>` | Required | Launcher component class (even if hidden) |
| `launcherTitle` | `string` | `'Home'` | Title for launcher tab (if shown) |
| `launcherIcon` | `string` | `'pi pi-home'` | Icon for launcher tab (if shown) |
| `showLauncher` | `boolean` | `true` | Whether to show launcher as a tab |
| `initialTabs` | `InnerTabItem[]` | `[]` | Tabs to open automatically |

### InnerTabItem Interface

```typescript
interface InnerTabItem {
  id: string;                           // Unique tab identifier
  parentTabId: string;                  // Parent tab context ID
  title: string;                        // Tab display title
  componentType: string | number;       // Component type from enum
  icon?: string;                        // Optional PrimeIcons class
  closable: boolean;                    // Can tab be closed?
  singleton?: boolean;                  // Only one instance allowed?
  data?: Record<string, unknown>;       // Data to pass to component
}
```

## Migration Guide

### Migrating from Traditional Launcher

If you want to convert an existing tab from using a launcher to using initial tabs:

**Before** (with launcher):
```typescript
@Component({
  selector: 'app-my-feature',
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.MYFEATURE"
      [launcherComponent]="MyLauncherComponent"
      [launcherTitle]="'Home'">
    </app-inner-tab-container>
  `
})
export class MyFeatureComponent {
  readonly launcherComponent = MyLauncherComponent;
}
```

**After** (with initial tabs):
```typescript
@Component({
  selector: 'app-my-feature',
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.MYFEATURE"
      [launcherComponent]="MyLauncherComponent"
      [showLauncher]="false"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class MyFeatureComponent {
  readonly launcherComponent = MyLauncherComponent;
  
  readonly initialTabs: InnerTabItem[] = [
    // Define your tabs here
  ];
}
```

## Conclusion

Hiding the launcher and using initial tabs provides flexibility in how you present your nested tab interface. Use this feature when:

- You want to skip the "home" screen and jump directly to content
- You're building a multi-document interface
- You want to pre-load multiple related views
- You're creating a dashboard with multiple widgets

For traditional workflows where users start from a central hub and open tabs as needed, keep the launcher visible.
