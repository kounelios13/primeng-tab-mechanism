import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { TabPanelComponent } from './tab-panel.component';
import { tabFeature, innerTabFeature } from '../store';

describe('TabPanelComponent', () => {
  let component: TabPanelComponent;
  let fixture: ComponentFixture<TabPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPanelComponent],
      providers: [
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
});
