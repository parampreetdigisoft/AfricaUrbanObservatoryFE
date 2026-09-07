import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluatorViewComponent } from './evaluator-view.component';

describe('EvaluatorViewComponent', () => {
  let component: EvaluatorViewComponent;
  let fixture: ComponentFixture<EvaluatorViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluatorViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EvaluatorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
