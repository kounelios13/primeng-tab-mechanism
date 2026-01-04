import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../../shared';
import { InnerTabComponentType, InnerTabItem, InnerTabConfig } from '../../store';
import { OverviewChartComponent } from './overview-chart/overview-chart.component';
import { OverviewReportComponent } from './overview-report/overview-report.component';

/**
 * Main Overview component that extends BaseTabWrapper.
 * This component:
 * - Defines the component registry for overview-related components
 * - Provides initial tabs to open automatically
 * - Listens to store actions filtered by its parentTabId
 * - Dispatches actions through the store to manage tabs
 */
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, TabsModule, ButtonModule],
  template: `
    <div class="inner-tab-container">
      @if (innerTabs().length > 0) {
        <p-tabs 
          [value]="activeTabId() ?? ''"
          (valueChange)="onTabValueChange($any($event))"
          styleClass="inner-tabs">
          
          <p-tablist>
            @for (tab of innerTabs(); track tab.id) {
              <p-tab [value]="tab.id" class="inner-tab-header">
                @if (tab.icon) {
                  <i [class]="tab.icon"></i>
                }
                <span class="tab-title">{{ tab.title }}</span>
                @if (tab.closable) {
                  <button 
                    class="close-button"
                    (click)="closeTab($event, tab.id)"
                    title="Close tab">
                    <i class="pi pi-times"></i>
                  </button>
                }
              </p-tab>
            }
          </p-tablist>
          
          <p-tabpanels>
            @for (tab of innerTabs(); track tab.id) {
              <p-tabpanel [value]="tab.id">
                <div class="inner-tab-content">
                  @if (getComponent(tab); as component) {
                    <ng-container *ngComponentOutlet="component; inputs: { tabData: tab.data, tabId: tab.id }"></ng-container>
                  } @else {
                    <div class="no-component-warning">
                      <i class="pi pi-exclamation-triangle"></i>
                      <p>Component not registered for type: {{ tab.componentType }}</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
  styles: [`
    .inner-tab-container {
      height: 100%;
    }

    .inner-tab-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab-title {
      margin: 0 0.25rem;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s, background-color 0.2s;
    }

    .close-button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .inner-tab-content {
      padding: 1rem;
    }

    .no-component-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #dc3545;
    }

    .no-component-warning i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
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

