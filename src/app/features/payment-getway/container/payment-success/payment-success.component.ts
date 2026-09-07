import { Component, computed, signal } from '@angular/core';
import { VerifySessionResponse } from '../../models/CheckoutSessionResponse';
import { PaymentStatus } from 'src/app/core/enums/TieredAccessPlan';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { PaymentService } from '../../payment.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CommonService } from 'src/app/core/services/common.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent {
verifySession = signal<VerifySessionResponse | null>(null);
  status = computed(() => this.verifySession() ? this.verifySession()?.paymentStatus : PaymentStatus.Pending);
  sessionId?: string;

  isLaoding = signal(false);

  sucess = PaymentStatus.Succeeded;

  constructor(private route: ActivatedRoute, private router: Router,
    private paymentService: PaymentService, private userService: UserService,
    private toasterService: ToasterService,private commonService:CommonService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(qp => {
      this.sessionId = qp['session_id'];
      if (this.sessionId) this.check();
    });
  }

  check() {
    if (this.userService.userInfo?.userID) {
      this.isLaoding.set(true);
      if (!this.sessionId) return;
      let paylod = {
        userID: this.userService.userInfo?.userID,
        sessionId: this.sessionId
      }
      this.paymentService.verifySession(paylod).subscribe({
        next: (res) => {
          this.isLaoding.set(false);
          if (res.succeeded) {
            this.verifySession.set(res.result);
            if(this.status()==PaymentStatus.Succeeded){
              this.refreshToken();
            }
          } else {
            this.toasterService.showError(res.errors.join(", "));
            this.isLaoding.set(false);
          }
        },
        error: () => {
          this.toasterService.showError("There is an error please try again");
        }
      });
    }
    else {
      this.router.navigate(['']);
    }
  }

  refreshToken(){
    this.commonService.refreshToken().subscribe({
      next:(res)=>{
        if(res.succeeded){
          this.userService.refreshSidebar.next(true);
        }
      },
      error:()=> {
          this.toasterService.showError("There is an error please try again");
      }
    });
  }
}
