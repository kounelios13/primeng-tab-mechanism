import { Type } from '@angular/core';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabConfig } from '../../store';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { ProjectSettingsComponent } from './project-settings/project-settings.component';

/**
 * Tab wrapper for managing project-related inner tabs.
 * Extends BaseTabWrapper to provide project-specific tab management functionality.
 * 
 * This class:
 * - Defines the component registry for project-related components
 * - Provides methods to open specific project tabs
 * - Can be used with InnerTabContainerComponent in wrapper mode
 * 
 * @example
 * ```typescript
 * @Component({...})
 * export class ProjectsComponent {
 *   wrapper = new ProjectTabWrapper();
 *   
 *   // Use wrapper.componentRegistry with InnerTabContainerComponent
 *   // Call wrapper.openProjectDetail() to open tabs dynamically
 * }
 * ```
 */
export class ProjectTabWrapper extends BaseTabWrapper<InnerTabComponentType> {
  readonly parentTabId = PARENT_TAB_IDS.PROJECTS;

  /**
   * Component registry for project-related inner tabs.
   * Maps component types to their component classes for dynamic loading.
   */
  readonly componentRegistry: ComponentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
    [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
  ]);

  /**
   * Override canOpenTab for custom validation logic.
   * Example: Prevent opening more than 5 detail tabs.
   */
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    if (componentType === InnerTabComponentType.ProjectDetail) {
      const detailTabCount = this.currentTabs().filter(
        tab => tab.componentType === InnerTabComponentType.ProjectDetail
      ).length;
      if (detailTabCount >= 5) {
        return false;
      }
    }
    return true;
  }

  /**
   * Opens project settings tab.
   * This is a SINGLETON - only one settings tab can be open at a time.
   */
  openProjectSettings(): void {
    this.openInnerTab({
      id: 'project-settings',
      title: 'Project Settings',
      componentType: InnerTabComponentType.ProjectSettings,
      icon: 'pi pi-cog',
      closable: true,
      singleton: true
    });
  }

  /**
   * Opens a project detail view for a specific project.
   * Multiple detail tabs can be open (NOT a singleton).
   */
  openProjectDetail(projectId: string, projectName: string): void {
    const tabId = `project-detail-${projectId}`;
    
    // Check if this specific project is already open
    const existingTab = this.findTabById(tabId);
    if (existingTab) {
      this.focusExistingTab(existingTab.id);
      return;
    }

    this.openInnerTab({
      id: tabId,
      title: projectName,
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-folder',
      closable: true,
      data: { projectId, projectName }
    });
  }

  /**
   * Opens a form to create a new project.
   */
  openNewProjectForm(): void {
    this.openInnerTab({
      id: this.generateTabId('project-new'),
      title: 'New Project',
      componentType: InnerTabComponentType.ProjectDetail,
      icon: 'pi pi-plus',
      closable: true,
      data: { mode: 'create' }
    });
  }
}
