import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, Subject } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from '../auth.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CityUserSignUpDto } from '../model/CityUserSignUpDto';
import { CommonService } from 'src/app/core/services/common.service';
import { StorageKeyEnum } from 'src/app/core/enums/StorageKeyEnum';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit {

  public errorMessage: string = '';
  public loading: boolean = false;
  private destroy$ = new Subject();
  public roleName: string = 'login';
  isSuccess: boolean = false;
  role: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private toasterService: ToasterService,
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    var deepset = this.getDeepestChild(this.route);
    this.roleName = deepset?.snapshot?.data['roles'] ?? '';
    this.role = this.route.snapshot.queryParamMap.get('role');
    if (this.roleName === 'clientPortalLogin') {
      this.role = '3';
    }
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.getDeepestChild(this.route)),
        mergeMap((r) => r.data)
      )
      .subscribe((data) => {
        this.roleName = data['roles'] ?? '';
        if (this.roleName === 'clientPortalLogin') {
          this.role = '3';
        }
      });
  }
  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    let r = route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    return r;
  }

  public login(event: FormGroup) {
    if (!this.loading) {
      if (event.value.email != null && event.value.password != null) {
        this.loading = true;
        this.authService.login(event.value.email, event.value.password, event.value.rememberMe)
          .subscribe({
            next: (res) => {
              this.loading = false;
              if (res.succeeded) {
                if (res.result?.userID) {
                  if ((this.roleName === 'clientPortalLogin' && res?.result?.role == 'CityUser') || (this.roleName === 'login' && res?.result?.role != 'CityUser')) {
                    this.toasterService.showSuccess('Login successful');
                    this.userService.RedirectBasedOnRole();
                  }
                  else {
                    this.toasterService.showError('Invalid credentials, please try again');
                    this.userService.logoutNotRedirect();
                  }
                }
                else if (this.roleName === 'clientPortalLogin' || this.roleName === 'login') {
                  localStorage.setItem(StorageKeyEnum.UserKey, event.value.email ?? '');
                  this.toasterService.showSuccess(res?.messages?.join(", "));
                  this.router.navigate(['/auth/2fa-verification']);
                }
                else {
                  this.toasterService.showError('Invalid credentials, please try again');
                  this.userService.logoutNotRedirect();
                }
              }
              else {
                this.toasterService.showError(res?.errors?.join(", "));
              }
            },
            error: (err) => {
              this.loading = false;
              this.toasterService.showError("Invalid credentials");
            },
          })
      }
    }
  }
  public resetPassword(event: FormGroup) {
    if (!this.loading) {
      if (event.value.password != null) {
        this.loading = true;
        this.authService.resetPassword(event.value)
          .subscribe({
            next: (res) => {
              this.loading = false;
              if (res.succeeded) {
                this.isSuccess = true;
                this.toasterService.showSuccess("Password changed successfully");
              }
              else {
                this.toasterService.showError(res?.errors?.join(", "));
              }
            },
            error: (err) => {
              this.loading = false;
            },
          })
      }
    }
  }
  public cityUserSignUp(event: CityUserSignUpDto) {
    if (!this.loading) {
      if (event) {
        this.loading = true;
        this.authService
          .cityUserSignUp(event)
          .subscribe({
            next: (res) => {
              this.loading = false;
              if (res.succeeded) {
                this.toasterService.showSuccess(res.messages.join(", "));
                setTimeout(() => {
                  this.userService.RedirectBasedOnRole();
                }, 500);
              } else {
                this.toasterService.showError(res?.errors?.join(', '));
                this.userService.RedirectBasedOnRole();
              }
            },
            error: () => {
              this.loading = false;
              this.toasterService.showError('There is an error please try again!');
            },
          });
      }
    }
  }

  public sendEmail(email: string) {
    if (!this.loading) {
      this.loading = true;
      this.authService.forgotPassword(email)
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res.succeeded) {
              this.isSuccess = true;
              this.toasterService.showSuccess(res.messages.join(", "))
            }
            else {
              this.toasterService.showError(res.errors.join(","))
            }
          },
          error: (err) => {
            this.loading = false;
          },
        })
    }
  }
  confirmMail(event: string) {
    if (!this.loading) {
      this.loading = true;
      this.authService.confirmMail(event)
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res.succeeded) {
              this.isSuccess = true;
              this.toasterService.showSuccess(res.messages.join(", "));
              this.refreshToken();
            }
            else {
              this.toasterService.showError(res.errors.join(","));
              this.userService.RedirectBasedOnRole();
            }
          },
          error: (err) => {
            this.loading = false;
          },
        });
    }
  }

  refreshToken() {
    this.commonService.refreshToken().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.userService.RedirectBasedOnRole();
        }
      },
      error: () => {
        this.loading = false;
        this.toasterService.showError("There is an error please try again");
      }
    });
  }
  twofaVerification(otp: number) {
    this.loading = true;
    let email = localStorage.getItem(StorageKeyEnum.UserKey);
    this.authService.twofaVerification(email ?? '', otp).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.succeeded) {
          this.toasterService.showSuccess('Login successful');
          this.userService.RedirectBasedOnRole();
        }
        else {
          this.toasterService.showError(res?.errors?.join(", "))
        }
      },
      error: () => {
        this.loading = false;
        this.toasterService.showError("There is an error please try again");
      }
    });
  }
  reSendOtp() {
    let email = localStorage.getItem(StorageKeyEnum.UserKey);
    this.authService.reSendLoginOtp(email ?? '').subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.toasterService.showSuccess(res?.messages?.join(", "));
        }
        else {
          this.toasterService.showError(res?.errors?.join(", "))
        }
      },
      error: () => {
        this.toasterService.showError("There is an error please try again");
      }
    });
  }
}
