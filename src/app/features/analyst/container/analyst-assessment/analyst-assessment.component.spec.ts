import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalystAssessmentComponent } from './analyst-assessment.component';

describe('AnalystAssessmentComponent', () => {
  let component: AnalystAssessmentComponent;
  let fixture: ComponentFixture<AnalystAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalystAssessmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnalystAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
