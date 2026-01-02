import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseInnerTabContainer, PARENT_TAB_IDS } from '../../shared';
import { OverviewLauncherComponent } from './overview-launcher/overview-launcher.component';

/**
 * Main Overview tab component.
 * Extends BaseInnerTabContainer to directly manage nested tabs for overview operations.
 * This eliminates the need for a separate InnerTabContainerComponent wrapper.
 */
@Component({
  selector: 'app-overview',
  imports: [CommonModule, TabsModule, ButtonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent extends BaseInnerTabContainer implements OnInit {
  protected override parentTabId = PARENT_TAB_IDS.OVERVIEW;
  protected override launcherComponent = OverviewLauncherComponent;
  protected override launcherTitle = 'Dashboard';
  protected override launcherIcon = 'pi pi-home';

  override ngOnInit(): void {
    this.initializeInnerTabs();
  }
}
