import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

/**
 * Component to display reports in an overview inner tab.
 */
@Component({
  selector: 'app-overview-report',
  imports: [CommonModule, CardModule, ButtonModule, TableModule],
  templateUrl: './overview-report.component.html',
  styleUrl: './overview-report.component.scss',
})
export class OverviewReportComponent implements OnInit {
  /**
   * Data passed from the inner tab system.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this inner tab.
   */
  @Input() tabId?: string;

  reportType: string = '';
  
  // Mock report data
  reportData = [
    { task: 'UI Redesign', completed: 15, pending: 3, progress: 83 },
    { task: 'API Integration', completed: 8, pending: 5, progress: 62 },
    { task: 'Testing', completed: 20, pending: 10, progress: 67 },
    { task: 'Documentation', completed: 5, pending: 2, progress: 71 }
  ];

  reportSummary = {
    totalTasks: 68,
    completedTasks: 48,
    pendingTasks: 20,
    overallProgress: 71
  };

  ngOnInit(): void {
    if (this.tabData) {
      this.reportType = (this.tabData['reportType'] as string) || 'Report';
    }
  }

  getReportPeriod(): string {
    switch (this.reportType) {
      case 'Weekly':
        return 'December 16 - December 22, 2024';
      case 'Monthly':
        return 'December 2024';
      default:
        return 'Current Period';
    }
  }
}
