import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
} from "@angular/router";
import { UserService } from "./user.service";

@Injectable({ providedIn: "root" })
export class RoleGuard implements CanActivate, CanActivateChild {

  constructor(private userService: UserService) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAccess(next, state);
  }

  canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAccess(next, state);
  }

  private checkAccess(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUrl = state.url;
    var role = this.userService?.userInfo?.role?.toLowerCase();

    var isValidUrl = currentUrl.includes(role);

    if (this.userService.isTokenExpired) {
      this.userService.logout();
    }
    if ((isValidUrl || currentUrl == '' || currentUrl == '/') && role) {
      return true;
    }
    this.userService.logout();
    return false
  }
}
