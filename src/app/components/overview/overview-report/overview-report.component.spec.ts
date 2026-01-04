import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewReportComponent } from './overview-report.component';

describe('OverviewReportComponent', () => {
  let component: OverviewReportComponent;
  let fixture: ComponentFixture<OverviewReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize reportType from tabData', () => {
    component.tabData = { reportType: 'Weekly' };
    component.ngOnInit();
    expect(component.reportType).toBe('Weekly');
  });

  it('should return default period for unknown report type', () => {
    component.reportType = 'Unknown';
    expect(component.getReportPeriod()).toBe('Current Period');
  });

  it('should return weekly period for Weekly report type', () => {
    component.reportType = 'Weekly';
    expect(component.getReportPeriod()).toContain('December');
  });

  it('should return monthly period for Monthly report type', () => {
    component.reportType = 'Monthly';
    expect(component.getReportPeriod()).toBe('December 2024');
  });

  it('should have report data with proper structure', () => {
    expect(component.reportData.length).toBeGreaterThan(0);
    expect(component.reportData[0].task).toBeDefined();
    expect(component.reportData[0].completed).toBeDefined();
    expect(component.reportData[0].pending).toBeDefined();
    expect(component.reportData[0].progress).toBeDefined();
  });

  it('should have report summary with proper structure', () => {
    expect(component.reportSummary.totalTasks).toBeDefined();
    expect(component.reportSummary.completedTasks).toBeDefined();
    expect(component.reportSummary.pendingTasks).toBeDefined();
    expect(component.reportSummary.overallProgress).toBeDefined();
  });
});
