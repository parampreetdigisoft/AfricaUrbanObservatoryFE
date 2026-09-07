import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';
import { TieredAccessPlanValue } from '../enums/TieredAccessPlan';

export const tierAccessGuard: CanActivateFn = (route, state) => {
  let userService = inject(UserService);
  let router = inject(Router);
  let user = userService.userInfo;

  if(user.tier != TieredAccessPlanValue.Pending){
    return true;
  }
  else {
    router.navigate(['cityuser/payment']);
    return false;
  }
};
