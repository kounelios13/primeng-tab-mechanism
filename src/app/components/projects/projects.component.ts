import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { ProjectLauncherComponent } from './project-launcher/project-launcher.component';

/**
 * Main Projects component that wraps the inner tab system.
 * Uses InnerTabContainerComponent to manage launcher and inner tabs.
 */
@Component({
  selector: 'app-projects',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.PROJECTS"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Projects Home'"
      [launcherIcon]="'pi pi-folder'">
    </app-inner-tab-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = ProjectLauncherComponent;
}
