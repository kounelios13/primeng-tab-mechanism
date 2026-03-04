import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { IInnerTabComponent } from '../../../shared';

/**
 * Component to display charts in an overview inner tab.
 *
 * Implements {@link IInnerTabComponent} to declare the standard inner-tab inputs.
 */
@Component({
  selector: 'app-overview-chart',
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './overview-chart.component.html',
  styleUrl: './overview-chart.component.scss',
})
export class OverviewChartComponent implements OnInit, IInnerTabComponent {
  /** Data passed from the inner tab system. */
  @Input() tabData?: Record<string, unknown>;

  /** The ID of this inner tab instance. */
  @Input() tabId?: string;

  /** The parent tab context ID, passed automatically by BaseTabWrapper. */
  @Input() parentTabId?: string;

  chartType: string = '';
  
  // Mock chart data
  chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [65, 78, 85, 92]
  };

  ngOnInit(): void {
    if (this.tabData) {
      this.chartType = (this.tabData['chartType'] as string) || 'Chart';
    }
  }

  getChartDescription(): string {
    switch (this.chartType) {
      case 'Progress':
        return 'This chart shows the overall project progress over the past weeks.';
      case 'Performance':
        return 'This chart displays team performance metrics and productivity trends.';
      default:
        return 'Chart visualization for project data.';
    }
  }
}
