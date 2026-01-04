import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem } from '../../store';
import { OverviewChartComponent } from './overview-chart/overview-chart.component';
import { OverviewReportComponent } from './overview-report/overview-report.component';

/**
 * Main Overview component that extends BaseTabWrapper.
 * This component:
 * - Defines the component registry for overview-related components
 * - Provides initial tabs to open automatically
 * - Listens to store actions filtered by its parentTabId
 * - Dispatches actions through the store to manage tabs
 * 
 * Template and styles are inherited from BaseTabWrapper.
 */
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: '../../shared/base-tab-wrapper.html',
  styleUrl: '../../shared/base-tab-wrapper.scss'
})
export class OverviewComponent extends BaseTabWrapper<InnerTabComponentType> {
  /**
   * Parent tab ID for this wrapper.
   */
  readonly parentTabId = PARENT_TAB_IDS.OVERVIEW;

  /**
   * Component registry for overview-related inner tabs.
   * Maps component types to their component classes for dynamic loading.
   */
  readonly componentRegistry: ComponentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.OverviewChart, OverviewChartComponent],
    [InnerTabComponentType.OverviewReport, OverviewReportComponent]
  ]);
  
  /**
   * Initial tabs to open when the Overview tab is activated.
   * We open a chart and a report tab by default.
   */
  override readonly initialTabs: InnerTabItem[] = [
    {
      id: 'overview-chart-progress',
      parentTabId: PARENT_TAB_IDS.OVERVIEW,
      title: 'Progress Chart',
      componentType: InnerTabComponentType.OverviewChart,
      icon: 'pi pi-chart-bar',
      closable: true,
      data: { chartType: 'Progress' }
    },
    {
      id: 'overview-report-weekly',
      parentTabId: PARENT_TAB_IDS.OVERVIEW,
      title: 'Weekly Report',
      componentType: InnerTabComponentType.OverviewReport,
      icon: 'pi pi-file',
      closable: true,
      data: { reportType: 'Weekly' }
    }
  ];

  /**
   * Opens a chart view.
   */
  openChartView(chartType: string): void {
    this.openInnerTab({
      id: this.generateTabId(`chart-${chartType}`),
      title: `${chartType} Chart`,
      componentType: InnerTabComponentType.OverviewChart,
      icon: 'pi pi-chart-bar',
      closable: true,
      data: { chartType }
    });
  }

  /**
   * Opens a report view.
   */
  openReport(reportType: string): void {
    this.openInnerTab({
      id: this.generateTabId(`report-${reportType}`),
      title: `${reportType} Report`,
      componentType: InnerTabComponentType.OverviewReport,
      icon: 'pi pi-file',
      closable: true,
      data: { reportType }
    });
  }
}

