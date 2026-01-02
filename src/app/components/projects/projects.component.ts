import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseInnerTabContainer, PARENT_TAB_IDS } from '../../shared';
import { ProjectLauncherComponent } from './project-launcher/project-launcher.component';

/**
 * Main Projects component that directly manages the inner tab system.
 * Extends BaseInnerTabContainer to manage launcher and inner tabs.
 * This eliminates the need for a separate InnerTabContainerComponent wrapper.
 */
@Component({
  selector: 'app-projects',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent extends BaseInnerTabContainer implements OnInit {
  protected override parentTabId = PARENT_TAB_IDS.PROJECTS;
  protected override launcherComponent = ProjectLauncherComponent;
  protected override launcherTitle = 'Projects Home';
  protected override launcherIcon = 'pi pi-folder';

  override ngOnInit(): void {
    this.initializeInnerTabs();
  }
}
