import { Component } from '@angular/core';
import { InnerTabContainerComponent } from '../../shared/inner-tab-container/inner-tab-container.component';
import { OverviewLauncherComponent } from './overview-launcher/overview-launcher.component';
import { InnerTabComponentType } from '../../store';

/**
 * Main Overview tab component.
 * Uses the InnerTabContainerComponent to manage nested tabs for overview operations.
 */
@Component({
  selector: 'app-overview',
  imports: [InnerTabContainerComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent {
  /**
   * The launcher component type for the overview inner tabs.
   */
  readonly launcherComponent = OverviewLauncherComponent;

  /**
   * The component type enum value for the launcher.
   */
  readonly launcherComponentType = InnerTabComponentType.OverviewLauncher;
}
