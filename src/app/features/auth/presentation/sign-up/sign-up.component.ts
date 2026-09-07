declare const FB: any;
import { AuthService } from '../../auth.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { environment } from 'src/environments/environment';
import { UserRoleValue } from 'src/app/core/enums/UserRole';
import { CityUserSignUpDto } from '../../model/CityUserSignUpDto';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AfterViewInit, ChangeDetectorRef, Component, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit, AfterViewInit {
  signupForm: FormGroup;
  submitsignUpDetail = output<CityUserSignUpDto>();
  loading = input<boolean>(false);
  isSuccess = input<boolean>(false);
  externalLogin = signal<CityUserSignUpDto | null>(null);
  cities = signal<CityVM[]>([]);
  captchaToken: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private toasterService: ToasterService,private cdr: ChangeDetectorRef) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      is2FAEnabled: [false],
      password: [null, [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{0,40}$')]],
      confirmPassword: [null, [Validators.required]],
      recaptcha: ['', Validators.required]
    }, { validator: this.confirmPasswordValidator('password', 'confirmPassword') });

  }
  ngOnInit(): void {
    //this.getCities();
  }
  externalLoginForm(external: CityUserSignUpDto) {
    this.externalLogin.set(external);
    this.signupForm.patchValue({
        fullName:external.fullName,
        email:external.email
      });
    this.signupForm.updateValueAndValidity();
    this.cdr.detectChanges();
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

  getCities() {
    this.authService.getAllCities().subscribe({
      next: (res) => {
        if (res.succeeded && res.result) {
          this.cities.set(res.result);
        }
        else {
          this.toasterService.showError("Please refresh page and try again");
        }
      },
      error: () => {
        this.toasterService.showError("Please refresh page or check you internent connection");
      }
    });
  }

  ngAfterViewInit() {
    this.authService.initGoogleButton('googleBtn', (response) => {
      const user = JSON.parse(atob(response.credential.split('.')[1]));
      if (user?.name && user?.email) {
        let payload: CityUserSignUpDto = {
          fullName: user.name,
          email: user.email,
          phone: '',
          password: '',
          role: UserRoleValue.CityUser,
          isConfrimed: true,
          is2FAEnabled :false
        };
        this.externalLoginForm(payload);
      }
      else {
        this.toasterService.showError("There is an error Please try again");
      }
    });

    if (typeof FB !== 'undefined') {
      FB.init({
        appId: environment.facebookAppId,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    }
  }
  loginWithFacebook() {
    FB.login(
      (response: any) => {
        if (response.authResponse) {
          FB.api('/me', { fields: 'name,email,picture' }, (user: any) => {
            if (user?.name && user?.email) {
              let payload: CityUserSignUpDto = {
                fullName: user.name,
                email: user.email,
                phone: '',
                password: '',
                role: UserRoleValue.CityUser,
                isConfrimed: true,
                is2FAEnabled :false
              };
              this.externalLoginForm(payload);
            }
            else {
              this.toasterService.showError("There is an error Please try again");
            }
          });
        }
        else {
          this.toasterService.showError("There is an error to connect with facebook");
        }
      },
      { scope: 'email' }
    );
  }

  get f() {
    return this.signupForm.controls;
  }

  submit() {
    if (this.signupForm.invalid) {
      // mark all controls as touched to show validation messages
      Object.values(this.signupForm.controls).forEach((control) => control.markAsTouched());
      return;
    }
    let f = this.signupForm.value;
    let payload: CityUserSignUpDto = {
      fullName: f?.fullName,
      email: f?.email,
      phone: f?.phone,
      password: f?.password,
      role: UserRoleValue.CityUser,
      isConfrimed: this.externalLogin() !=null ,
      is2FAEnabled :f?.is2FAEnabled
    };
    this.submitsignUpDetail.emit(payload);
  }
      
  resolved(token: any ) {
    this.captchaToken = token;
    this.signupForm.patchValue({ recaptcha: token });
  }

}
