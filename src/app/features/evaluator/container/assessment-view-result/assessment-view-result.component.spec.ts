import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentViewResultComponent } from './assessment-view-result.component';

describe('AssessmentViewResultComponent', () => {
  let component: AssessmentViewResultComponent;
  let fixture: ComponentFixture<AssessmentViewResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentViewResultComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssessmentViewResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
