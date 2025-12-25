import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType } from '../../../store';
import { OverviewChartComponent } from '../overview-chart/overview-chart.component';
import { OverviewReportComponent } from '../overview-report/overview-report.component';

/**
 * Launcher component for the Overview inner tab system.
 * Provides buttons to open various overview-related inner tabs.
 */
@Component({
  selector: 'app-overview-launcher',
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './overview-launcher.component.html',
  styleUrl: './overview-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewLauncherComponent extends BaseTabLauncher {
  protected parentTabId = PARENT_TAB_IDS.OVERVIEW;

  /**
   * Initialize the component registry with overview-specific components.
   */
  protected initializeComponentRegistry(): void {
    this.registerComponent(InnerTabComponentType.OverviewChart, OverviewChartComponent);
    this.registerComponent(InnerTabComponentType.OverviewReport, OverviewReportComponent);
  }

  // Sample stats for demonstration
  stats = {
    completedTasks: 24,
    pendingTasks: 8,
    teamMembers: 5,
    activeProjects: 3
  };

  // Recent activity items
  recentActivity = [
    { icon: 'pi pi-check', message: 'Task "Update documentation" completed', time: '2 hours ago' },
    { icon: 'pi pi-plus', message: 'New task "Review code changes" added', time: '4 hours ago' },
    { icon: 'pi pi-user', message: 'John Doe joined the project', time: '1 day ago' }
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
