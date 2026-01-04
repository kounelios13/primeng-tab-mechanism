import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { TaskDetailComponent } from './task-detail.component';
import { tabFeature, innerTabFeature } from '../../../store';

describe('TaskDetailComponent', () => {
  let component: TaskDetailComponent;
  let fixture: ComponentFixture<TaskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideStore({
          [tabFeature.name]: tabFeature.reducer,
          [innerTabFeature.name]: innerTabFeature.reducer
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
