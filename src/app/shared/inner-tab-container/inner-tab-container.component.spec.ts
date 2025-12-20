import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerTabContainerComponent } from './inner-tab-container.component';

describe('InnerTabContainerComponent', () => {
  let component: InnerTabContainerComponent;
  let fixture: ComponentFixture<InnerTabContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InnerTabContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InnerTabContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
