import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem, InnerTabConfig } from '../../store';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { ProjectSettingsComponent } from './project-settings/project-settings.component';

/**
 * Main Projects component that extends BaseTabWrapper.
 * This component:
 * - Defines the component registry for project-related components
 * - Provides initial tabs to open automatically
 * - Listens to store actions filtered by its parentTabId
 * - Dispatches actions through the store to manage tabs
 * 
 * The BaseTabWrapper provides:
 * - Tab container UI with dynamic component loading
 * - Store-based action handling for tab management
 * - Helper methods like openInnerTab(), closeInnerTab(), etc.
 */
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  template: `
    <div class="inner-tab-container">
      @if (innerTabs().length > 0) {
        <p-tabs 
          [value]="activeTabId() ?? ''"
          (valueChange)="onTabValueChange($any($event))"
          styleClass="inner-tabs">
          
          <p-tablist>
            @for (tab of innerTabs(); track tab.id) {
              <p-tab [value]="tab.id" class="inner-tab-header">
                @if (tab.icon) {
                  <i [class]="tab.icon"></i>
                }
                <span class="tab-title">{{ tab.title }}</span>
                @if (tab.closable) {
                  <button 
                    class="close-button"
                    (click)="closeTab($event, tab.id)"
                    title="Close tab">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </p-tab>
            }
          </p-tablist>
          
          <p-tabpanels>
            @for (tab of innerTabs(); track tab.id) {
              <p-tabpanel [value]="tab.id">
                <div class="inner-tab-content">
                  @if (getComponent(tab); as component) {
                    <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id }"></ng-container>
                  } @else {
                    <div class="no-component-warning">
                      <i class="pi pi-exclamation-triangle"></i>
                      <p>Component not registered for type: {{ tab.componentType }}</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
  styles: [`
    .inner-tab-container {
      height: 100%;
    }

    .inner-tab-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab-title {
      margin: 0 0.25rem;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s, background-color 0.2s;
    }

    .close-button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .inner-tab-content {
      padding: 1rem;
    }

    .no-component-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #dc3545;
    }

    .no-component-warning i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export class ProjectsComponent extends BaseTabWrapper<InnerTabComponentType> {
  /**
   * Parent tab ID for this wrapper.
   */
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
   * Initial tabs to open when the Projects tab is activated.
   * These tabs will be opened automatically.
   */
  override readonly initialTabs: InnerTabItem[] = [
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

  /**
   * Override canOpenTab for custom validation logic.
   * Example: Prevent opening more than 5 detail tabs.
   */
  protected override canOpenTab(componentType: InnerTabComponentType, config: InnerTabConfig): boolean {
    if (componentType === InnerTabComponentType.ProjectDetail) {
      const detailTabCount = this.innerTabs().filter(
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
