import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InnerTabContainerComponent, PARENT_TAB_IDS } from '../../shared';
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
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent {
  /**
   * Parent tab ID constant for template binding.
   */
  readonly PARENT_TAB_IDS = PARENT_TAB_IDS;

  /**
   * The launcher component type for the overview inner tabs.
   */
  readonly launcherComponent = OverviewLauncherComponent;

  /**
   * The component type enum value for the launcher.
   */
  readonly launcherComponentType = InnerTabComponentType.OverviewLauncher;
}
