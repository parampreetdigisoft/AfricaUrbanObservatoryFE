import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { UserRole } from '../enums/UserRole';
import { StorageKeyEnum } from '../enums/StorageKeyEnum';
import { AssessmentWithProgressVM } from '../models/AssessmentResponse';
import { TieredAccessPlanValue } from '../enums/TieredAccessPlan';
import { PublicUserLocalStorageResponse, UpdateUserResponseDto, UserInfo } from '../models/UserInfo';

interface DecodedToken {
  exp: number;
  userId: string;
  tier: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userInfoSource = new BehaviorSubject<UserInfo>(this.getUserInfo());
  private tokenExpirationSource = new BehaviorSubject<Date>(new Date(this.userInfo?.tokenExpirationDate));
  public assessmentProgress = new BehaviorSubject<AssessmentWithProgressVM | null>(null);
  public refreshSidebar = new BehaviorSubject<boolean>(false);
  constructor(private router: Router) { }

  get userInfo() {
    return this.userInfoSource.value;
  }

  set userInfo(user: UserInfo) {
    if (user) {
      this.userInfoSource.next(user);
      this.isTokenRefresh = new Date(user?.tokenExpirationDate);
      this.setItem(user);
    } else {
      localStorage.removeItem(StorageKeyEnum.UserInfo);
    }
  }

  updateUser(user: UpdateUserResponseDto) {
    let data = this.userInfo;

    let currentData: UserInfo = {
      isActive: data.isActive,
      tokenExpirationDate: data.tokenExpirationDate,
      fullName: user.fullName,
      profileImagePath: user.profileImagePath,
      phone: user.phone,
      userID: data.userID,
      token: data.token,
      rememberMe: data.rememberMe,
      email: data.email,
      isDeleted: data.isDeleted,
      role: data.role,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: data.createdAt,
      isEmailConfirmed: data.isEmailConfirmed,
      isLoggedIn: data.isLoggedIn,
      tier: user.tier
    };
    this.userInfo = currentData;
  }

  get isTokenRefresh(): boolean {
    const now = new Date().getTime(); // current time in ms
    const expiration = this.tokenExpirationSource.value.getTime(); // expiry in ms
    const diffMinutes = (expiration - now) / (1000 * 60);
    return diffMinutes <= 30;
  }

  set isTokenRefresh(date: Date) {
    this.tokenExpirationSource.next(date);
  }

  get isTokenExpired(): boolean {
    if (!this.userInfo?.tokenExpirationDate) return true;

    return new Date().getTime() >= new Date(this.userInfo.tokenExpirationDate).getTime();
  }


  setItem(user: UserInfo) {
    let localSData: PublicUserLocalStorageResponse = {
      isActive: user.isActive,
      profileImagePath: user.profileImagePath,
      token: user.token,
      rememberMe: user.rememberMe
    }
    localStorage.setItem(StorageKeyEnum.UserInfo, JSON.stringify(localSData));
  }
  private getUserInfo(): UserInfo {
    const userJson = localStorage.getItem(StorageKeyEnum.UserInfo);
    if (!userJson) return null as any;

    const user = JSON.parse(userJson) as UserInfo;

    const decoded = this.decodeToken(user.token);
    if (decoded) {
      user.email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? null;
      user.role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
      const tierName = decoded['Tier'];
      user.tier = (tierName in TieredAccessPlanValue)
        ? TieredAccessPlanValue[tierName as keyof typeof TieredAccessPlanValue]
        : TieredAccessPlanValue.Pending;

      user.userID = Number(decoded['UserId']) || 0;

      // Convert exp (seconds) → milliseconds → Date
      if (decoded.exp) {
        user.tokenExpirationDate = new Date(decoded.exp * 1000);
      } else {
        user.tokenExpirationDate = new Date(0);
      }
    }
    return user;
  }
  private decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  RedirectBasedOnRole(): void {
    const role = this.userInfo?.role?.toLowerCase() ?? "";
    setTimeout(() => {
      switch (role) {
        case UserRole.Admin.toLowerCase():
          this.router.navigate(['/admin/dashboard'], { state: { role: UserRole.Admin } });
          break;
        case UserRole.Analyst.toLowerCase():
          this.router.navigate(['/analyst/dashboard'], { state: { role: UserRole.Analyst } });
          break;
        case UserRole.Evaluator.toLowerCase():
          this.router.navigate(['/evaluator/dashboard'], { state: { role: UserRole.Evaluator } });
          break;
        case UserRole.CityUser.toLowerCase():
          this.router.navigate(['/cityuser/dashboard'], { state: { role: UserRole.CityUser } });
          break;
        default:
          this.router.navigate(['/']);
      }
    }, 0);
  }

  logout() {
    let role = this.userInfo?.role;
    let url = '/auth/clientPortalLogin';
    if (role && role?.toLowerCase() !== UserRole.CityUser.toLowerCase()) {
      url = '/auth/login';
    }
    localStorage.removeItem(StorageKeyEnum.UserInfo);
    this.userInfo = null as any;
    this.router.navigate([url]);
  }
  logoutNotRedirect() {
    localStorage.removeItem(StorageKeyEnum.UserInfo);
    this.userInfo = null as any;
  }
}
