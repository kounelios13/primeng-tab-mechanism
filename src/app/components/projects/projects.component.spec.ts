import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { ProjectsComponent } from './projects.component';
import { tabFeature, innerTabFeature } from '../../store';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [
        provideStore({
          [tabFeature.name]: tabFeature.reducer,
          [innerTabFeature.name]: innerTabFeature.reducer
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
