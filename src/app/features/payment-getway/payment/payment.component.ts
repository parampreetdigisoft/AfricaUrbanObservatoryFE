import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TieredAccessPlanValue } from 'src/app/core/enums/TieredAccessPlan';
import { CommonService } from 'src/app/core/services/common.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  constructor(private userService:UserService, private router:Router, private route: ActivatedRoute,private commonService:CommonService){}

  ngOnInit(): void {
    var userInfo = this.userService.userInfo

    let activeRoute = this.route.firstChild;
    let url = this.RenderActivatedRoute();
    if(userInfo.tier != null && userInfo?.tier != TieredAccessPlanValue.Pending){

    }
    else if(url =="payment-success" || url =="payment-cancel"){
    
    }
  }

  private RenderActivatedRoute() {
    const deepest = this.getDeepestChild(this.route);
    return deepest?.snapshot?.data['roles'] ?? '';
  }
  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    let r = route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    return r;
  }
}
