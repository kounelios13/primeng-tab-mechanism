import { Component, Type } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem } from '../../store';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { ProjectSettingsComponent } from './project-settings/project-settings.component';

/**
 * Main Projects component that wraps the inner tab system.
 * Uses InnerTabContainerComponent to manage dynamic inner tabs.
 * 
 * This example demonstrates the **wrapper mode** - using a component registry
 * directly without a launcher component. This allows dynamic tabs to be
 * automatically rendered based on store requests.
 */
@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.PROJECTS"
      [componentRegistry]="componentRegistry"
      [showLauncher]="false"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class ProjectsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  
  /**
   * Component registry for project-related inner tabs.
   * Maps component types to their component classes for dynamic loading.
   * This replaces the need for a launcher component.
   */
  readonly componentRegistry: ComponentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
    [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
  ]);
  
  /**
   * Initial tabs to open when the Projects tab is activated.
   * These tabs will be opened automatically.
   * Note: parentTabId is set automatically by the container, but included here for type compliance.
   */
  readonly initialTabs: InnerTabItem[] = [
    {
      id: 'project-detail-1',
      parentTabId: PARENT_TAB_IDS.PROJECTS,  // Will be set by container
      title: 'Website Redesign',
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId: '1', projectName: 'Website Redesign' }
    },
    {
      id: 'project-detail-2',
      parentTabId: PARENT_TAB_IDS.PROJECTS,  // Will be set by container
      title: 'Mobile App Development',
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId: '2', projectName: 'Mobile App Development' }
    },
    {
      id: 'project-settings',
      parentTabId: PARENT_TAB_IDS.PROJECTS,  // Will be set by container
      title: 'Project Settings',
      componentType: InnerTabComponentType.ProjectSettings,
      icon: 'pi pi-cog',
      closable: true,
      data: { mode: 'settings' }
    }
  ];
}
