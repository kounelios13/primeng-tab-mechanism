import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { TasksComponent } from './tasks.component';
import { tabFeature, innerTabFeature } from '../../store';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideStore({
          [tabFeature.name]: tabFeature.reducer,
          [innerTabFeature.name]: innerTabFeature.reducer
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
