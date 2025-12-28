import { Component, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType, InnerTabConfig } from '../../../store';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { ProjectSettingsComponent } from '../project-settings/project-settings.component';

/**
 * Launcher component for the Projects inner tab system.
 * Provides buttons to open various project-related inner tabs.
 */
@Component({
  selector: 'app-project-launcher',
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './project-launcher.component.html',
  styleUrl: './project-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.PROJECTS;

  /**
   * Component registry for project-related inner tabs.
   * Maps component types to their component classes for dynamic loading.
   */
  override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.ProjectDetail, ProjectDetailComponent],
    [InnerTabComponentType.ProjectSettings, ProjectSettingsComponent]
  ]);

  // Sample project data for demonstration
  recentProjects = [
    { id: '1', name: 'Website Redesign', status: 'Active', members: 5 },
    { id: '2', name: 'Mobile App Development', status: 'Planning', members: 3 },
    { id: '3', name: 'Database Migration', status: 'Active', members: 4 },
    { id: '4', name: 'API Integration', status: 'Completed', members: 2 }
  ];

  /**
   * Override canOpenTab for custom validation logic.
   * Example: Prevent opening more than 5 detail tabs.
   */
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    // Example: Limit number of ProjectDetail tabs to 5
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
      id: 'project-settings',  // Fixed ID for singleton
      title: 'Project Settings',
      componentType: InnerTabComponentType.ProjectSettings,
      icon: 'pi pi-cog',
      closable: true,
      singleton: true,  // Only one instance allowed
      data: { mode: 'settings' }
    });
  }

  /**
   * Opens a project detail view for a specific project.
   * Multiple detail tabs can be open (NOT a singleton).
   */
  openProjectDetail(projectId: string, projectName: string): void {
    // Check if this specific project is already open
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
