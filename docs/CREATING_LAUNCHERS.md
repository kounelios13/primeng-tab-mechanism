# Creating Launchers and Managing Inner Tabs

This guide explains how to create new launcher components and use the NgRx store to manage inner tabs in the PrimeNG Tab Mechanism application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step: Creating a New Launcher](#step-by-step-creating-a-new-launcher)
4. [Step-by-Step: Creating Inner Tab Components](#step-by-step-creating-inner-tab-components)
5. [Using the Store to Open Tabs](#using-the-store-to-open-tabs)
6. [Advanced Patterns](#advanced-patterns)
7. [Complete Example](#complete-example)

---

## Architecture Overview

The application uses a **nested tab system** with:

- **Main Tabs**: Top-level tabs (Tasks, Overview, etc.)
- **Inner Tabs**: Nested tabs within each main tab
- **Launcher Components**: Special inner tabs that act as home pages with buttons to open other inner tabs
- **NgRx Store**: Centralized state management for all tab operations

### Component Hierarchy

```
TabPanelComponent (main tabs)
├── TasksComponent → InnerTabContainerComponent
│   ├── TaskLauncherComponent (extends BaseTabLauncher)
│   ├── TaskDetailComponent (inner tab)
│   └── TaskFormComponent (inner tab)
└── OverviewComponent → InnerTabContainerComponent
    ├── OverviewLauncherComponent (extends BaseTabLauncher)
    ├── OverviewChartComponent (inner tab)
    └── OverviewReportComponent (inner tab)
```

### Key Concepts

- **BaseTabLauncher**: Abstract base class that provides tab management functionality
- **InnerTabComponentType**: Enum defining all available inner tab types
- **TAB_COMPONENT_REGISTRY**: Maps component types to Angular component classes
- **PARENT_TAB_IDS**: Constants for parent tab identifiers (always use these!)
- **Angular Signals**: Used for reactive state management with `toSignal()`

---

## Prerequisites

Before creating a new launcher, ensure you understand:

1. **Angular 19 Standalone Components**: All components use `imports` array, no NgModules
2. **Angular Signals**: Using `toSignal()` for reactive state
3. **OnPush Change Detection**: All components use `ChangeDetectionStrategy.OnPush`
4. **NgRx Store**: Actions, reducers, and selectors pattern
5. **PrimeNG New Tabs API**: `p-tabs`, `p-tablist`, `p-tab`, `p-tabpanels`, `p-tabpanel`

---

## Step-by-Step: Creating a New Launcher

Let's create a launcher for a new "Projects" feature.

### Step 1: Add Parent Tab ID Constant

First, add your new parent tab ID to the constants file:

```typescript
// src/app/shared/constants.ts

export const PARENT_TAB_IDS = {
  TASKS: 'tasks',
  OVERVIEW: 'overview',
  PROJECTS: 'projects'  // ← Add your new parent tab ID
} as const;

export const ALL_PARENT_TAB_IDS: ParentTabId[] = [
  PARENT_TAB_IDS.TASKS,
  PARENT_TAB_IDS.OVERVIEW,
  PARENT_TAB_IDS.PROJECTS  // ← Add to array
];
```

### Step 2: Add Component Types to Enum

Add your inner tab component types to the enum:

```typescript
// src/app/store/inner-tab.actions.ts

export enum InnerTabComponentType {
  // ... existing types ...
  
  // Projects-related inner tabs
  ProjectLauncher = 'project-launcher',
  ProjectDetail = 'project-detail',
  ProjectSettings = 'project-settings',
  ProjectMembers = 'project-members'
}
```

### Step 3: Create the Launcher Component

Generate the component:

```bash
ng generate component components/projects/project-launcher
```

Implement the launcher by extending `BaseTabLauncher`:

```typescript
// src/app/components/projects/project-launcher/project-launcher.component.ts

import { Component, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType, InnerTabConfig } from '../../../store';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { ProjectSettingsComponent } from '../project-settings/project-settings.component';

@Component({
  selector: 'app-project-launcher',
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './project-launcher.component.html',
  styleUrl: './project-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectLauncherComponent extends BaseTabLauncher {
  // REQUIRED: Set the parent tab ID
  protected parentTabId = PARENT_TAB_IDS.PROJECTS;

  // REQUIRED: Register components for dynamic loading
  override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
    [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
  ]);

  // Sample data for your launcher
  recentProjects = [
    { id: '1', name: 'Website Redesign', status: 'Active' },
    { id: '2', name: 'Mobile App', status: 'Planning' }
  ];

  /**
   * Optional: Override canOpenTab for custom validation
   */
  protected override canOpenTab(
    componentType: InnerTabComponentType,
    config: InnerTabConfig
  ): boolean {
    // Example: Limit number of detail tabs
    if (componentType === InnerTabComponentType.ProjectDetail) {
      const detailCount = this.currentTabs().filter(
        t => t.componentType === componentType
      ).length;
      return detailCount < 10;
    }
    return true;
  }

  /**
   * Opens project settings tab (singleton)
   */
  openSettings(): void {
    this.openInnerTab({
      id: 'project-settings',
      title: 'Project Settings',
      componentType: InnerTabComponentType.ProjectSettings,
      icon: 'pi pi-cog',
      closable: true,
      singleton: true  // Only one settings tab allowed
    });
  }

  /**
   * Opens a project detail tab
   */
  openProjectDetail(projectId: string, projectName: string): void {
    // Check if already open
    const existingTab = this.findTabById(`project-detail-${projectId}`);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: `project-detail-${projectId}`,
      title: projectName,
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId, projectName }
    });
  }
}
```

### Step 4: Create the Launcher Template

```html
<!-- src/app/components/projects/project-launcher/project-launcher.component.html -->

<div class="launcher-container">
  <h2>Projects Home</h2>
  
  <div class="actions">
    <p-button 
      label="Settings" 
      icon="pi pi-cog"
      (onClick)="openSettings()">
    </p-button>
  </div>

  <p-card header="Recent Projects">
    @for (project of recentProjects; track project.id) {
      <div class="project-item">
        <span>{{ project.name }}</span>
        <p-button 
          label="Open" 
          size="small"
          (onClick)="openProjectDetail(project.id, project.name)">
        </p-button>
      </div>
    }
  </p-card>
</div>
```

### Step 5: Register Components in Registry

Update the global component registry:

```typescript
// src/app/shared/tab-component-registry.ts

import { ProjectLauncherComponent } from '../components/projects/project-launcher/project-launcher.component';
import { ProjectDetailComponent } from '../components/projects/project-detail/project-detail.component';
import { ProjectSettingsComponent } from '../components/projects/project-settings/project-settings.component';

export const TAB_COMPONENT_REGISTRY: Partial<Record<InnerTabComponentType, Type<unknown>>> = {
  // ... existing registrations ...
  
  // Projects-related components
  [InnerTabComponentType.ProjectLauncher]: ProjectLauncherComponent,
  [InnerTabComponentType.ProjectDetail]: ProjectDetailComponent,
  [InnerTabComponentType.ProjectSettings]: ProjectSettingsComponent,
};
```

### Step 6: Create Parent Component

Create the main parent component that uses InnerTabContainerComponent:

```typescript
// src/app/components/projects/projects.component.ts

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { ProjectLauncherComponent } from './project-launcher/project-launcher.component';
import { InnerTabComponentType } from '../../store';

@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.PROJECTS"
      [launcherComponent]="launcherComponent"
      [launcherComponentType]="launcherComponentType"
      [launcherTitle]="'Projects Home'"
      [launcherIcon]="'pi pi-folder'">
    </app-inner-tab-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = ProjectLauncherComponent;
  readonly launcherComponentType = InnerTabComponentType.ProjectLauncher;
}
```

---

## Step-by-Step: Creating Inner Tab Components

Inner tab components are the content that opens when you click buttons in the launcher.

### Step 1: Generate the Component

```bash
ng generate component components/projects/project-detail
```

### Step 2: Implement the Component

```typescript
// src/app/components/projects/project-detail/project-detail.component.ts

import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ParentTabId } from '../../../shared';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailComponent implements OnInit {
  /**
   * Data passed from the inner tab system via ngComponentOutlet.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this inner tab.
   */
  @Input() tabId?: string;

  /**
   * The parent tab ID (optional, for context).
   */
  @Input() parentTabId?: ParentTabId;

  // Extracted from tabData
  projectId: string = '';
  projectName: string = '';

  // Component data
  projectDetails = {
    description: 'Project description here',
    startDate: new Date(),
    members: ['User 1', 'User 2']
  };

  ngOnInit(): void {
    if (this.tabData) {
      this.projectId = this.tabData['projectId'] as string || '';
      this.projectName = this.tabData['projectName'] as string || '';
      
      // Load project details based on projectId
      // this.loadProjectDetails(this.projectId);
    }
  }
}
```

### Step 3: Create the Template

```html
<!-- src/app/components/projects/project-detail/project-detail.component.html -->

<div class="project-detail">
  <h2>{{ projectName }}</h2>
  <p>Project ID: {{ projectId }}</p>
  
  <p-card header="Details">
    <p>{{ projectDetails.description }}</p>
    <p>Start Date: {{ projectDetails.startDate | date }}</p>
    
    <h4>Team Members</h4>
    <ul>
      @for (member of projectDetails.members; track member) {
        <li>{{ member }}</li>
      }
    </ul>
  </p-card>
</div>
```

---

## Using the Store to Open Tabs

### Understanding the Store Architecture

The store uses **NgRx** with a request-based pattern:

1. **Launcher calls** `this.openInnerTab()` → dispatches `requestAddInnerTab` action
2. **Store adds** request to `pendingRequests` array
3. **InnerTabContainerComponent listens** to `pendingRequests` via selector
4. **Container dispatches** `addInnerTab` action for each pending request
5. **Reducer processes** the action and updates state

### Store Actions

```typescript
// Available actions from InnerTabActions

// Request to add a tab (called from launcher)
InnerTabActions.requestAddInnerTab({ parentTabId, tab })

// Add tab (called from container, processes request)
InnerTabActions.addInnerTab({ parentTabId, tab })

// Remove a tab
InnerTabActions.removeInnerTab({ parentTabId, tabId })

// Set active tab
InnerTabActions.setActiveInnerTab({ parentTabId, tabId })

// Update tab properties
InnerTabActions.updateInnerTab({ parentTabId, tabId, updates })

// Initialize context (called from container on init)
InnerTabActions.initContext({ parentTabId, launcherTab })

// Clear all tabs for a parent
InnerTabActions.clearContext({ parentTabId })
```

### Store Selectors

```typescript
// Available selectors

// Get all inner tabs for a parent
selectInnerTabs(parentTabId)

// Get active tab ID
selectActiveInnerTabId(parentTabId)

// Get active tab object
selectActiveInnerTab(parentTabId)

// Get specific tab by ID
selectInnerTabById(parentTabId, tabId)

// Get tab count
selectInnerTabCount(parentTabId)

// Find tab by component type
selectInnerTabByType(parentTabId, componentType)

// Check if tab type is open
selectIsTabTypeOpen(parentTabId, componentType)

// Get pending requests for parent
selectPendingRequestsForParent(parentTabId)
```

### Using Selectors in Your Components

If you need to access tab state outside of `BaseTabLauncher`:

```typescript
import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectInnerTabs, PARENT_TAB_IDS } from '../../store';

export class MyComponent {
  private store = inject(Store);
  
  // Convert selector to signal
  readonly projectTabs: Signal<InnerTabItem[]> = toSignal(
    this.store.select(selectInnerTabs(PARENT_TAB_IDS.PROJECTS)),
    { initialValue: [] }
  );
  
  // Use in template: {{ projectTabs().length }}
  // Use in code: const count = this.projectTabs().length;
}
```

### Manually Dispatching Actions

If you need to open a tab from outside a launcher:

```typescript
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { InnerTabActions, InnerTabComponentType } from '../../store';
import { PARENT_TAB_IDS } from '../../shared';

export class SomeOtherComponent {
  private store = inject(Store);
  
  openProjectFromSomewhere(projectId: string): void {
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: PARENT_TAB_IDS.PROJECTS,
      tab: {
        id: `project-detail-${projectId}`,
        title: `Project ${projectId}`,
        componentType: InnerTabComponentType.ProjectDetail,
        icon: 'pi pi-folder',
        closable: true,
        data: { projectId }
      }
    }));
  }
}
```

---

## Advanced Patterns

### 1. Singleton Tabs

Only one instance allowed at a time:

```typescript
this.openInnerTab({
  id: 'settings',  // Fixed ID
  title: 'Settings',
  componentType: InnerTabComponentType.Settings,
  singleton: true,  // ← Prevents duplicates
  closable: true
});
```

If already open, it will focus the existing tab instead of creating a new one.

### 2. Unique Tabs by Entity

Multiple tabs of same type, but unique per entity:

```typescript
openProjectDetail(projectId: string): void {
  const tabId = `project-detail-${projectId}`;
  const existingTab = this.findTabById(tabId);
  
  if (existingTab) {
    this.focusExistingTab(existingTab.id);
    return;
  }
  
  this.openInnerTab({
    id: tabId,  // Unique per project
    title: `Project ${projectId}`,
    componentType: InnerTabComponentType.ProjectDetail,
    closable: true,
    data: { projectId }
  });
}
```

### 3. Limiting Number of Tabs

Override `canOpenTab()` to enforce limits:

```typescript
protected override canOpenTab(
  componentType: InnerTabComponentType,
  config: InnerTabConfig
): boolean {
  // Get current tabs using signal
  const currentTabs = this.currentTabs();
  
  // Count tabs of this type
  const count = currentTabs.filter(
    t => t.componentType === componentType
  ).length;
  
  // Enforce limit
  if (count >= 5) {
    console.warn('Maximum 5 tabs of this type allowed');
    return false;
  }
  
  return true;
}
```

### 4. Conditional Tab Opening

```typescript
openAdminPanel(): void {
  // Check if user has permission
  if (!this.hasAdminAccess) {
    alert('Access denied');
    return;
  }
  
  this.openInnerTab({
    id: 'admin-panel',
    title: 'Admin Panel',
    componentType: InnerTabComponentType.AdminPanel,
    singleton: true,
    closable: true
  });
}
```

### 5. Passing Complex Data

```typescript
openProjectEditor(project: Project): void {
  this.openInnerTab({
    id: `project-edit-${project.id}`,
    title: `Edit: ${project.name}`,
    componentType: InnerTabComponentType.ProjectEditor,
    closable: true,
    data: {
      projectId: project.id,
      projectName: project.name,
      projectData: project,  // Full object
      mode: 'edit',
      callbacks: {
        onSave: () => this.handleSave(),
        onCancel: () => this.closeInnerTab(`project-edit-${project.id}`)
      }
    }
  });
}
```

### 6. Updating Tab Properties

```typescript
markTabAsModified(tabId: string): void {
  this.updateInnerTab(tabId, {
    title: '* Modified Document',  // Add asterisk
    icon: 'pi pi-exclamation-circle'
  });
}
```

### 7. Helper Methods from BaseTabLauncher

All launchers have access to these methods:

```typescript
// Find tabs
this.findTabById(tabId)
this.findTabByType(componentType)
this.isTabTypeOpen(componentType)

// Manage tabs
this.openInnerTab(config)
this.closeInnerTab(tabId)
this.focusExistingTab(tabId)
this.setActiveInnerTab(tabId)
this.updateInnerTab(tabId, updates)

// Utilities
this.generateTabId('prefix')  // Creates unique ID

// Access current tabs (Signal)
this.currentTabs()  // Returns InnerTabItem[]
```

---

## Complete Example

Here's a complete, working example for a "Documents" feature:

### 1. Update Constants

```typescript
// src/app/shared/constants.ts
export const PARENT_TAB_IDS = {
  TASKS: 'tasks',
  OVERVIEW: 'overview',
  DOCUMENTS: 'documents'
} as const;
```

### 2. Add Component Types

```typescript
// src/app/store/inner-tab.actions.ts
export enum InnerTabComponentType {
  // ... existing ...
  DocumentLauncher = 'document-launcher',
  DocumentViewer = 'document-viewer',
  DocumentEditor = 'document-editor'
}
```

### 3. Launcher Component

```typescript
// src/app/components/documents/document-launcher/document-launcher.component.ts
import { Component, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType } from '../../../store';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { DocumentEditorComponent } from '../document-editor/document-editor.component';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
}

@Component({
  selector: 'app-document-launcher',
  imports: [CommonModule, ButtonModule, TableModule],
  templateUrl: './document-launcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.DOCUMENTS;

  override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.DocumentViewer, DocumentViewerComponent],
    [InnerTabComponentType.DocumentEditor, DocumentEditorComponent]
  ]);

  documents: Document[] = [
    { id: '1', name: 'Project Plan.pdf', type: 'PDF', size: '2.5 MB' },
    { id: '2', name: 'Budget.xlsx', type: 'Excel', size: '1.2 MB' },
    { id: '3', name: 'Notes.txt', type: 'Text', size: '15 KB' }
  ];

  openDocument(doc: Document): void {
    const tabId = `doc-view-${doc.id}`;
    
    // Check if already open
    if (this.findTabById(tabId)) {
      this.focusExistingTab(tabId);
      return;
    }

    this.openInnerTab({
      id: tabId,
      title: doc.name,
      componentType: InnerTabComponentType.DocumentViewer,
      icon: 'pi pi-file',
      closable: true,
      data: { documentId: doc.id, documentName: doc.name }
    });
  }

  editDocument(doc: Document): void {
    const tabId = `doc-edit-${doc.id}`;
    
    if (this.findTabById(tabId)) {
      this.focusExistingTab(tabId);
      return;
    }

    this.openInnerTab({
      id: tabId,
      title: `Edit: ${doc.name}`,
      componentType: InnerTabComponentType.DocumentEditor,
      icon: 'pi pi-pencil',
      closable: true,
      data: { documentId: doc.id, documentName: doc.name, mode: 'edit' }
    });
  }

  createNewDocument(): void {
    this.openInnerTab({
      id: this.generateTabId('doc-new'),
      title: 'New Document',
      componentType: InnerTabComponentType.DocumentEditor,
      icon: 'pi pi-plus',
      closable: true,
      data: { mode: 'create' }
    });
  }
}
```

### 4. Launcher Template

```html
<!-- src/app/components/documents/document-launcher/document-launcher.component.html -->
<div class="document-launcher">
  <div class="header">
    <h2>Documents</h2>
    <p-button 
      label="New Document" 
      icon="pi pi-plus"
      (onClick)="createNewDocument()">
    </p-button>
  </div>

  <p-table [value]="documents">
    <ng-template pTemplate="header">
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Size</th>
        <th>Actions</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-doc>
      <tr>
        <td>{{ doc.name }}</td>
        <td>{{ doc.type }}</td>
        <td>{{ doc.size }}</td>
        <td>
          <p-button 
            icon="pi pi-eye" 
            size="small"
            [text]="true"
            (onClick)="openDocument(doc)">
          </p-button>
          <p-button 
            icon="pi pi-pencil" 
            size="small"
            [text]="true"
            (onClick)="editDocument(doc)">
          </p-button>
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>
```

### 5. Document Viewer Component

```typescript
// src/app/components/documents/document-viewer/document-viewer.component.ts
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-document-viewer',
  imports: [CommonModule, CardModule],
  template: `
    <div class="document-viewer">
      <p-card [header]="documentName">
        <p>Document ID: {{ documentId }}</p>
        <p>Viewing document content...</p>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent implements OnInit {
  @Input() tabData?: Record<string, unknown>;
  @Input() tabId?: string;

  documentId: string = '';
  documentName: string = '';

  ngOnInit(): void {
    if (this.tabData) {
      this.documentId = this.tabData['documentId'] as string || '';
      this.documentName = this.tabData['documentName'] as string || '';
    }
  }
}
```

### 6. Register Components

```typescript
// src/app/shared/tab-component-registry.ts
import { DocumentLauncherComponent } from '../components/documents/document-launcher/document-launcher.component';
import { DocumentViewerComponent } from '../components/documents/document-viewer/document-viewer.component';
import { DocumentEditorComponent } from '../components/documents/document-editor/document-editor.component';

export const TAB_COMPONENT_REGISTRY: Partial<Record<InnerTabComponentType, Type<unknown>>> = {
  // ... existing ...
  [InnerTabComponentType.DocumentLauncher]: DocumentLauncherComponent,
  [InnerTabComponentType.DocumentViewer]: DocumentViewerComponent,
  [InnerTabComponentType.DocumentEditor]: DocumentEditorComponent,
};
```

### 7. Parent Component

```typescript
// src/app/components/documents/documents.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { DocumentLauncherComponent } from './document-launcher/document-launcher.component';
import { InnerTabComponentType } from '../../store';

@Component({
  selector: 'app-documents',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.DOCUMENTS"
      [launcherComponent]="launcherComponent"
      [launcherComponentType]="launcherComponentType"
      [launcherTitle]="'Documents'"
      [launcherIcon]="'pi pi-file'">
    </app-inner-tab-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = DocumentLauncherComponent;
  readonly launcherComponentType = InnerTabComponentType.DocumentLauncher;
}
```

---

## Key Takeaways

1. **Always extend BaseTabLauncher** for launcher components
2. **Always use PARENT_TAB_IDS constants** instead of hardcoded strings
3. **Always register components** in both the launcher's `componentRegistry` AND the global `TAB_COMPONENT_REGISTRY`
4. **Use signals** with `this.currentTabs()` (with parentheses!)
5. **Use OnPush change detection** for all components
6. **Check for existing tabs** before opening to prevent duplicates
7. **Use singleton pattern** for tabs that should only have one instance
8. **Pass data through the `data` property** in tab config
9. **Receive data via `@Input() tabData`** in inner tab components
10. **The store uses a request pattern** - launchers dispatch `requestAddInnerTab`, container processes it

---

## Troubleshooting

### Tab doesn't open
- Check that component is registered in both registries
- Check that componentType enum value exists
- Verify `canOpenTab()` returns true
- Check browser console for errors

### Tab opens but shows nothing
- Verify component is imported in launcher
- Check that component has correct selector
- Verify TAB_COMPONENT_REGISTRY mapping is correct

### Multiple tabs open for singleton
- Ensure `singleton: true` is set in config
- Use same `id` for singleton tabs
- Check that you're using the same componentType

### Data not passing to inner tab
- Ensure you're setting `data` property in config
- Verify inner tab has `@Input() tabData`
- Check that you're reading from tabData in ngOnInit

### Signal errors
- Always use `this.currentTabs()` with parentheses
- Ensure you're using `toSignal()` with `initialValue`
- Don't try to mutate signal values directly

---

## Next Steps

1. Read the Angular 19 documentation on Signals
2. Review the existing launchers (Tasks, Overview) for examples
3. Study the NgRx store structure in `src/app/store`
4. Experiment with the existing tabs to understand the flow
5. Create your own feature following this guide

For questions or issues, refer to the source code or the project maintainers.
