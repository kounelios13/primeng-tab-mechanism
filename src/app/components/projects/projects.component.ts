import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { ProjectLauncherComponent } from './project-launcher/project-launcher.component';
import { InnerTabComponentType, InnerTabItem } from '../../store';

/**
 * Main Projects component that wraps the inner tab system.
 * Uses InnerTabContainerComponent to manage launcher and inner tabs.
 * 
 * This example demonstrates hiding the launcher tab and opening initial tabs instead.
 */
@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.PROJECTS"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Projects Home'"
      [launcherIcon]="'pi pi-folder'"
      [showLauncher]="showLauncher"
      [initialTabs]="initialTabs">
    </app-inner-tab-container>
  `
})
export class ProjectsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = ProjectLauncherComponent;
  
  /**
   * Set to false to hide the launcher tab.
   * Toggle this to see the difference.
   */
  readonly showLauncher = false;
  
  /**
   * Initial tabs to open when the Projects tab is activated.
   * These tabs will be opened automatically.
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
