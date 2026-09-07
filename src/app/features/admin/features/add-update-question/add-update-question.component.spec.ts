import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateQuestionComponent } from './add-update-question.component';

describe('AddUpdateQuestionComponent', () => {
  let component: AddUpdateQuestionComponent;
  let fixture: ComponentFixture<AddUpdateQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUpdateQuestionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUpdateQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
