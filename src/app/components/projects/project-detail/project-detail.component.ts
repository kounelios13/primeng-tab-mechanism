import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { IInnerTabComponent } from '../../../shared';

/**
 * Project detail component showing project information.
 * This is an inner tab component that receives data via @Input() tabData.
 *
 * Implements {@link IInnerTabComponent} to declare the standard inner-tab inputs.
 */
@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, CardModule, ButtonModule, TabsModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit, IInnerTabComponent {
  /** Data passed from the inner tab system via ngComponentOutlet. */
  @Input() tabData?: Record<string, unknown>;

  /** The ID of this inner tab instance. */
  @Input() tabId?: string;

  /** The parent tab context ID, passed automatically by BaseTabWrapper. */
  @Input() parentTabId?: string;

  // Extracted from tabData
  projectId: string = '';
  projectName: string = '';
  mode: string = 'view';

  // Component data
  projectDetails = {
    description: 'A comprehensive project to modernize our web infrastructure and improve user experience.',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    status: 'Active',
    budget: '$150,000',
    members: [
      { name: 'Alice Johnson', role: 'Project Manager' },
      { name: 'Bob Smith', role: 'Lead Developer' },
      { name: 'Carol White', role: 'UI/UX Designer' },
      { name: 'David Brown', role: 'QA Engineer' },
      { name: 'Eve Davis', role: 'DevOps Engineer' }
    ],
    milestones: [
      { name: 'Requirements Gathering', status: 'Completed', date: '2024-01-30' },
      { name: 'Design Phase', status: 'Completed', date: '2024-02-28' },
      { name: 'Development Sprint 1', status: 'In Progress', date: '2024-03-31' },
      { name: 'Testing & QA', status: 'Pending', date: '2024-05-31' },
      { name: 'Deployment', status: 'Pending', date: '2024-06-30' }
    ]
  };

  ngOnInit(): void {
    if (this.tabData) {
      this.projectId = this.tabData['projectId'] as string || '';
      this.projectName = this.tabData['projectName'] as string || '';
      this.mode = this.tabData['mode'] as string || 'view';
      
      // In a real app, you would load project details based on projectId
      // this.loadProjectDetails(this.projectId);
    }
  }
}
