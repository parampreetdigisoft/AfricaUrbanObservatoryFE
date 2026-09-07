import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluatorResponseViewComponent } from './evaluator-response-view.component';

describe('EvaluatorResponseViewComponent', () => {
  let component: EvaluatorResponseViewComponent;
  let fixture: ComponentFixture<EvaluatorResponseViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluatorResponseViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EvaluatorResponseViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
