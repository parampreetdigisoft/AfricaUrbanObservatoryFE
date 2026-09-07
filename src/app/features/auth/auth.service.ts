import { Injectable } from '@angular/core';
import { map, Subject, tap } from 'rxjs';
import { HttpService } from 'src/app/core/http/http.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';
import { UserInfo } from 'src/app/core/models/UserInfo';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { CityUserSignUpDto } from './model/CityUserSignUpDto';
declare const google: any;
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public errorMessage: Subject<any> = new Subject<any>();

  constructor(private http: HttpService, private userService: UserService) { }

  public login(email: string, password: string, rememberMe: boolean) {
    const data = JSON.stringify({ email, password });
    return this.http.post(`Auth/login`, data)
      .pipe(
        map(x => x as ResultResponseDto<UserInfo>),
        tap((user) => {
          if (user && user.succeeded && user.result && user.result.userID) {
            user.result.rememberMe = rememberMe;
            this.userService.userInfo = user.result;
          }
        }));
  }

  public forgotPassword(email: string) {
    const data = JSON.stringify({ email });
    return this.http.post(`Auth/forgotPassword`, data)
      .pipe(map((x) => x as ResultResponseDto<object>));;
  }
  public confirmMail(token: string) {
    const data = JSON.stringify({ passwordToken: token });
    return this.http.post(`Auth/confirmMail`, data)
      .pipe(map((x) => x as ResultResponseDto<object>));;
  }


  public resetPassword(data: any) {
    return this.http.post(`Auth/changePassword`, data).pipe(map(x => x as ResultResponseDto<any>),);
  }

  public cityUserSignUp(data: CityUserSignUpDto) {
    return this.http
      .post(`Auth/CityUserSignUp`, data)
      .pipe(
        map(x => x as ResultResponseDto<UserInfo | any>),
        tap((user) => {
          if (user?.result?.userID) {
            this.userService.userInfo = user.result;
          }

        }));
  }
  public getAllCities() {
    return this.http
      .get(`Public/getAllCities`)
      .pipe(map((x) => x as ResultResponseDto<CityVM[]>));
  }
  public initGoogleButton(elementId: string, callback: (response: any) => void) {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback
      });

      google.accounts.id.renderButton(
        document.getElementById(elementId),
        { theme: 'outline', size: 'large' }
      );
    }
  }
  public twofaVerification(email: string, otp: number) {
    const data = JSON.stringify({ email, otp });
    return this.http.post(`Auth/twofaVerification`, data)
      .pipe(
        map(x => x as ResultResponseDto<UserInfo>),
        tap((user) => {
          if (user && user.succeeded && user.result && user.result.userID) {
            user.result.rememberMe = true;
            this.userService.userInfo = user.result;
          }
        }));
  }
  public reSendLoginOtp(email: string) {
    const data = JSON.stringify({ email });
    return this.http.post(`Auth/reSendLoginOtp`, data)
      .pipe(
        map(x => x as ResultResponseDto<UserInfo>),
        tap((user) => {
          if (user && user.succeeded && user.result && user.result.userID) {
            user.result.rememberMe = true;
            this.userService.userInfo = user.result;
          }
        }));
  }
}
