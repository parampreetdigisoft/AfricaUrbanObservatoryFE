import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-account-pop-up',
  templateUrl: './account-pop-up.component.html',
  styleUrl: './account-pop-up.component.css'
})
export class AccountPopUpComponent {
  
@Output() event = new EventEmitter();
@Input() title: string='';
@Input() text: string='';
@Input() buttonText: string='Log In';

  email: string = '';

  constructor() { }
  onSubmit() {
    this.event.emit({});    
  }

}
