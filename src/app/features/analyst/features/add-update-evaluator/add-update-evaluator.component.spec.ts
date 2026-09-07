import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateEvaluatorComponent } from './add-update-evaluator.component';

describe('AddUpdateEvaluatorComponent', () => {
  let component: AddUpdateEvaluatorComponent;
  let fixture: ComponentFixture<AddUpdateEvaluatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUpdateEvaluatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUpdateEvaluatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
