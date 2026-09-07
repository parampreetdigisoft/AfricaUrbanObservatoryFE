import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeAssessmentComponent } from './make-assessment.component';

describe('MakeAssessmentComponent', () => {
  let component: MakeAssessmentComponent;
  let fixture: ComponentFixture<MakeAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeAssessmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MakeAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
