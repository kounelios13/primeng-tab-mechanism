import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskLauncherComponent } from './task-launcher.component';

describe('TaskLauncherComponent', () => {
  let component: TaskLauncherComponent;
  let fixture: ComponentFixture<TaskLauncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskLauncherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskLauncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
