import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ParentTabId } from '../../../shared';

/**
 * Project settings component for configuring project preferences.
 * This is an inner tab component that receives data via @Input() tabData.
 */
@Component({
  selector: 'app-project-settings',
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, InputSwitchModule],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSettingsComponent implements OnInit {
  /**
   * Data passed from the inner tab system via ngComponentOutlet.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this inner tab.
   */
  @Input() tabId?: string;

  /**
   * The parent tab ID (optional, for context).
   */
  @Input() parentTabId?: ParentTabId;

  // Settings data
  settings = {
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: false,
      milestoneAlerts: true
    },
    preferences: {
      autoSave: true,
      showCompletedTasks: true,
      defaultView: 'kanban'
    },
    integrations: {
      slackEnabled: false,
      githubEnabled: true,
      jiraEnabled: false
    }
  };

  ngOnInit(): void {
    if (this.tabData) {
      const mode = this.tabData['mode'] as string || 'settings';
      // Load settings if needed
    }
  }

  saveSettings(): void {
    // TODO: Implement backend API call to save settings
    console.log('Saving settings:', this.settings);
  }

  resetSettings(): void {
    // TODO: Implement reset to default settings functionality
    console.log('Resetting settings to defaults');
  }
}
