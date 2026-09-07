import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  @Output() UserLogin = new EventEmitter();
  @Input() loading: boolean = false;
  @Input() role: string | null= '';
  isSubmitted =false;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe:[true]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.isSubmitted =true;
    if (this.loginForm.valid) {
      this.UserLogin.next(this.loginForm);
      this.isSubmitted=false;
    }
  }
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  get email() {
    return this.loginForm.get('email');
  }
}