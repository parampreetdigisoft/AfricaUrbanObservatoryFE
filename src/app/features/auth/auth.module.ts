import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AccountComponent } from './account/account.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './presentation/login/login.component';
import { SignUpComponent } from './presentation/sign-up/sign-up.component';
import { ConfirmMailComponent } from './presentation/confirm-mail/confirm-mail.component';
import { AccountPopUpComponent } from './presentation/account-pop-up/account-pop-up.component';
import { ResetPasswordComponent } from './presentation/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './presentation/forgot-password/forgot-password.component';
import { TwofaVerificationComponent } from './presentation/twofa-verification/twofa-verification.component';
import { SharedModule } from 'src/app/shared/share.module';
import { RECAPTCHA_SETTINGS, RecaptchaModule, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';


const routes: Routes = [{
  path: '', component: AccountComponent, data: { roles: [] }, children: [
    { path: '', redirectTo: 'clientPortalLogin', pathMatch: 'full' },
    { path: 'login', component: LoginComponent, data: { roles: 'login' } },
    { path: 'clientPortalLogin', component: LoginComponent, data: { roles: 'clientPortalLogin' } },
    { path: 'sign-up', component: SignUpComponent, data: { roles: 'sign-up' } },
    { path: 'forgot-password', component: ForgotPasswordComponent, data: { roles: 'forgot-password' } },
    { path: 'confirm-mail', component: ConfirmMailComponent, data: { roles: 'confirm-mail' } },
    { path: 'reset-password', component: ResetPasswordComponent, data: { roles: 'reset-password' } },
    { path: '2fa-verification', component: TwofaVerificationComponent, data: { roles: '2fa-verification' } }]
}];

@NgModule({
  declarations: [
    AccountComponent,
    SignUpComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    AccountPopUpComponent,
    ConfirmMailComponent,
    TwofaVerificationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    SharedModule,
    RecaptchaModule,
    RouterModule.forChild(routes)
  ],
  providers: [
   RecaptchaModule,
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.captchaSiteKey } as RecaptchaSettings,
    },
  ]
})
export class AuthModule { } 