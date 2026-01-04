import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { OverviewLauncherComponent } from './overview-launcher/overview-launcher.component';

/**
 * Main Overview tab component.
 * Uses the InnerTabContainerComponent to manage nested tabs for overview operations.
 * 
 * Currently using the traditional launcher approach.
 * 
 * To use initial tabs, see the example in:
 * - docs/HIDING_LAUNCHER_AND_INITIAL_TABS.md
 * - src/app/components/projects/projects.component.ts
 */
@Component({
  selector: 'app-overview',
  imports: [InnerTabContainerComponent],
  template: `
    <app-inner-tab-container
      [parentTabId]="PARENT_TAB_IDS.OVERVIEW"
      [launcherComponent]="launcherComponent"
      [launcherTitle]="'Dashboard'"
      [launcherIcon]="'pi pi-home'">
    </app-inner-tab-container>
  `
})
export class OverviewComponent {
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;
  readonly launcherComponent = OverviewLauncherComponent;
}

