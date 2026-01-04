import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { OverviewComponent } from './overview.component';
import { tabFeature, innerTabFeature } from '../../store';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideStore({
          [tabFeature.name]: tabFeature.reducer,
          [innerTabFeature.name]: innerTabFeature.reducer
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
