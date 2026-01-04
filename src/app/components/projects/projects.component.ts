import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { InnerTabComponentType, InnerTabItem } from '../../store';
import { ProjectTabWrapper } from './project-tab-wrapper';

/**
 * Main Projects component that wraps the inner tab system.
 * Uses InnerTabContainerComponent with a ProjectTabWrapper to manage dynamic inner tabs.
 * 
 * This example demonstrates the **wrapper mode** - using a wrapper class
 * that extends BaseTabWrapper. The wrapper provides:
 * - Component registry for dynamic tab loading
 * - Methods to open specific tab types (openProjectDetail, openProjectSettings, etc.)
 * - Tab management utilities (findTabById, closeInnerTab, etc.)
 */
@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="wrapper.parentTabId"
      [componentRegistry]="wrapper.componentRegistry"
      [showLauncher]="false"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class ProjectsComponent {
  /**
   * Tab wrapper instance that manages project tabs.
   * Provides the component registry and methods to open/close tabs.
   */
  readonly wrapper = new ProjectTabWrapper();
  
  /**
   * Initial tabs to open when the Projects tab is activated.
   * These tabs will be opened automatically.
   * Note: parentTabId is set automatically by the container, but included here for type compliance.
   */
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
