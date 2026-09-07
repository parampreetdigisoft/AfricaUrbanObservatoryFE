import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnChanges {

@Output() forgotPassword = new EventEmitter();
@Input() loading: boolean=false;
@Input() isSuccess: boolean=false;

  email: string = '';

  constructor(private router:Router, private userService:UserService) { }
  ngOnChanges(changes: SimpleChanges): void {

  }
  onSubmit(form: NgForm) {
      this.forgotPassword.emit(this.email);    
  }
  popUpEvent(){
    setTimeout(() => {
      this.userService.logout();
    }, 5000);
     
  }
}
