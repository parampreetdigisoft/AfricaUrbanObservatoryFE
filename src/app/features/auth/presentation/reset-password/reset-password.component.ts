import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../auth.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {

  @Output() resetPassword = new EventEmitter();
  @Input() loading: boolean = false;
  @Input() isSuccess: boolean = false;

  public resetPasswordForm: FormGroup = new FormGroup({});
  private destroy$ = new Subject();
  params: any;

  constructor(private fb: FormBuilder, private router: Router,
    private activatedRoute: ActivatedRoute, private authService: AuthService,private userService:UserService) { }

  ngOnInit() {
    this.resetForm();
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.params = params;
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  private resetForm() {
    this.resetPasswordForm = this.fb.group({
      password: [null, [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{0,40}$')]],
      confirmPassword: [null, [Validators.required]],
      passwordToken: [null, [Validators.required]],
    }, { validator: this.confirmPasswordValidator('password', 'confirmPassword') });

  }

  private confirmPasswordValidator(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (matchingControl.errors && !matchingControl.errors['confirmPasswordValidator']) {
        return;
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ confirmPasswordValidator: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  public onSubmit() {
    this.resetPasswordForm?.patchValue({
      passwordToken: this.params['PasswordToken']
    });
    this.resetPassword.emit(this.resetPasswordForm)
  }

  popUpEvent() {
    this.userService.logout();
  }
}
