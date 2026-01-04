import { Component } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
import { OverviewLauncherComponent } from './overview-launcher/overview-launcher.component';
// import { InnerTabComponentType, InnerTabItem } from '../../store';

/**
 * Main Overview tab component.
 * Uses the InnerTabContainerComponent to manage nested tabs for overview operations.
 * 
 * Currently using the traditional launcher approach.
 * 
 * To use initial tabs WITH the launcher visible, uncomment the initialTabs below
 * and update the template to include [initialTabs]="initialTabs"
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

  /**
   * Example: Initial tabs that would open alongside the launcher.
   * Uncomment to use this feature:
   * 
   * 1. Uncomment the import at the top
   * 2. Uncomment this initialTabs array
   * 3. Add [initialTabs]="initialTabs" to the template
   */
  /*
  readonly initialTabs: InnerTabItem[] = [
    {
      id: 'overview-chart-sales',
      parentTabId: PARENT_TAB_IDS.OVERVIEW,
      title: 'Sales Chart',
      componentType: InnerTabComponentType.OverviewChart,
      icon: 'pi pi-chart-line',
      closable: true,
      data: { chartType: 'sales', period: 'monthly' }
    },
    {
      id: 'overview-report-summary',
      parentTabId: PARENT_TAB_IDS.OVERVIEW,
      title: 'Summary Report',
      componentType: InnerTabComponentType.OverviewReport,
      icon: 'pi pi-file',
      closable: true,
      data: { reportType: 'summary', format: 'pdf' }
    }
  ];
  */
}

