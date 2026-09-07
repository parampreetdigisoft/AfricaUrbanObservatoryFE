import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StorageKeyEnum } from '../enums/StorageKeyEnum';
import { UserService } from '../services/user.service';
import { UserInfo } from '../models/UserInfo';
import { CommonService } from '../services/common.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private userService: UserService,
    private commonService: CommonService
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const user = JSON.parse(localStorage.getItem(StorageKeyEnum.UserInfo) || '{}') as UserInfo;

    if (!(request.url.endsWith('register') || request.url.endsWith('login') || request.url.endsWith('confirmMail') || request.url.endsWith('twofaVerification') || request.url.endsWith('reSendLoginOtp') || request.url.endsWith('forgotPassword') ||
      request.url.endsWith('changePassword') || request.url.endsWith('getAllCities') || request.url.endsWith('CityUserSignUp') || request.url.includes('search'))) {
      if (user?.token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (this.userService.isTokenRefresh && user.rememberMe && !request.url.endsWith('refreshToken')) {
          return this.commonService.refreshToken().pipe(
            switchMap((resUser) => {
              const newToken = this.userService.userInfo?.token;
              const clonedRequest = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next.handle(clonedRequest);
            }),
            catchError((err) => {
              this.userService.logout();
              return throwError(() => err);
            })
          );
        }
      } else {
        this.userService.logout();
        return of();
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.userService.logout();
        }
        return throwError(() => error);
      })
    );
  }
} 