import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignedCityComponent } from './assigned-city.component';

describe('AssignedCityComponent', () => {
  let component: AssignedCityComponent;
  let fixture: ComponentFixture<AssignedCityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignedCityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignedCityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
