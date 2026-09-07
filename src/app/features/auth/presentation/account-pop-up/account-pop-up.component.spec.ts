import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountPopUpComponent } from './account-pop-up.component';

describe('AccountPopUpComponent', () => {
  let component: AccountPopUpComponent;
  let fixture: ComponentFixture<AccountPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountPopUpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AccountPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
