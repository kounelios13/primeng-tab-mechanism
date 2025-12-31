import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLauncherComponent } from './project-launcher.component';
import { provideStore } from '@ngrx/store';

describe('ProjectLauncherComponent', () => {
  let component: ProjectLauncherComponent;
  let fixture: ComponentFixture<ProjectLauncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLauncherComponent],
      providers: [provideStore({})]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectLauncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
