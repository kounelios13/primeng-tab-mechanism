import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TabPanelComponent } from './tab-panel.component';
import { tabFeature, innerTabFeature } from '../store';

describe('TabPanelComponent', () => {
  let component: TabPanelComponent;
  let fixture: ComponentFixture<TabPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPanelComponent],
      providers: [
        provideNoopAnimations(),
        provideStore({
          [tabFeature.name]: tabFeature.reducer,
          [innerTabFeature.name]: innerTabFeature.reducer
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have showLabels signal initialized to true', () => {
    expect(component.showLabels()).toBe(true);
  });

  it('should toggle showLabels when toggleLabels is called', () => {
    expect(component.showLabels()).toBe(true);
    component.toggleLabels();
    expect(component.showLabels()).toBe(false);
    component.toggleLabels();
    expect(component.showLabels()).toBe(true);
  });
});
