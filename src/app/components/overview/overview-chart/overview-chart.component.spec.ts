import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewChartComponent } from './overview-chart.component';

describe('OverviewChartComponent', () => {
  let component: OverviewChartComponent;
  let fixture: ComponentFixture<OverviewChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize chartType from tabData', () => {
    component.tabData = { chartType: 'Progress' };
    component.ngOnInit();
    expect(component.chartType).toBe('Progress');
  });

  it('should return default description for unknown chart type', () => {
    component.chartType = 'Unknown';
    expect(component.getChartDescription()).toBe('Chart visualization for project data.');
  });

  it('should return progress description for Progress chart type', () => {
    component.chartType = 'Progress';
    expect(component.getChartDescription()).toContain('project progress');
  });

  it('should return performance description for Performance chart type', () => {
    component.chartType = 'Performance';
    expect(component.getChartDescription()).toContain('performance metrics');
  });
});
