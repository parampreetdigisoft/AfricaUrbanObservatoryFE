import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateAnalystComponent } from './add-update-analyst.component';

describe('AddUpdateAnalystComponent', () => {
  let component: AddUpdateAnalystComponent;
  let fixture: ComponentFixture<AddUpdateAnalystComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUpdateAnalystComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUpdateAnalystComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
