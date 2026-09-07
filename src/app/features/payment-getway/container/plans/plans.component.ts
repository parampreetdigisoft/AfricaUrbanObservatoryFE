import { Component } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { ICreateCheckoutSessionDto, IPlan } from '../../models/ICreateCheckoutSessionDto';
import { PaymentService } from '../../payment.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TieredAccessPlanValue } from 'src/app/core/enums/TieredAccessPlan';
import { environment } from 'src/environments/environment';
import { StorageKeyEnum } from 'src/app/core/enums/StorageKeyEnum';
type PlanCategory = 'Evaluation' | 'Access';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.css'
})
export class PlansComponent {
  loading: boolean = false;
  userId!: string;
  stripePromise = loadStripe(environment.stripePublicKey);
  plans: IPlan[] = [
    { name: 'Basic', tier: TieredAccessPlanValue.Basic, amount: 1500 },
    { name: 'Standard', tier: TieredAccessPlanValue.Standard, amount: 2600 },
    { name: 'Premium', tier: TieredAccessPlanValue.Premium, amount: 3500 }
  ];

  plans1: Record<PlanCategory, IPlan[]> = {
    Evaluation: [
      { name: 'Basic', tier: TieredAccessPlanValue.Basic, amount: 14999 },
      { name: 'Standard', tier: TieredAccessPlanValue.Standard, amount: 27500 },
      { name: 'Premium', tier: TieredAccessPlanValue.Premium, amount: 0 }
    ],
    Access: [
      { name: 'Basic', tier: TieredAccessPlanValue.Basic, amount: 1500 },
      { name: 'Standard', tier: TieredAccessPlanValue.Standard, amount: 2600 },
      { name: 'Premium', tier: TieredAccessPlanValue.Premium, amount: 0 }
    ]
  };
  selectedPlan!: IPlan;
  agreeTerms = false;
  submitAttempted = false;

  baseUrl = environment.subscriptionUrl;
  constructor(private paymentService: PaymentService, private userService: UserService, private toasterService: ToasterService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    //this.route.queryParams.subscribe(qp => this.userId = qp['userId']);
    let exitingPlan = localStorage.getItem(StorageKeyEnum.SelectedPlan);
    if (exitingPlan) {
      this.selectPlan(exitingPlan);
    } else {
      this.selectPlan('Premium');
    }

  }



  selectPlan(planName: string) {
    let ind = this.plans.findIndex(p => p.name == planName);
    this.selectedPlan = this.plans[ind];
  }
  async makePayment() {

    this.toasterService.showInfo("Africa Urban Observatory is currently at the pilot stage. Login and subscription features are temporarily unavailable while we finalize our email and authentication system.");
    return

    // this.submitAttempted = true;
    // if (!this.agreeTerms) {
    //   return;
    // }
    // let payload: ICreateCheckoutSessionDto = {
    //   userID: this.userService.userInfo?.userID ?? 0,
    //   tier: this.selectedPlan.tier,
    //   amount: this.selectedPlan.amount
    // }
    // this.loading = true;

    // this.paymentService.createCheckoutSession(payload).subscribe({
    //   next: async (res) => {
    //     this.loading = false;
    //     if (res.succeeded && res.result) {
    //       const stripe = await this.stripePromise;
    //       if (stripe) {
    //         if (!stripe) { alert('Stripe failed to load'); return; }
    //         const { error } = await stripe.redirectToCheckout({ sessionId: res.result.sessionId });
    //         if (error) {
    //           this.toasterService.showError("An error occured " + error.message);
    //         }
    //       } else {
    //         this.toasterService.showError("Stripe failed to load");
    //       }
    //     }
    //     else {
    //       this.toasterService.showError(res.errors.join(", "));
    //     }
    //   },
    //   error: () => {
    //     this.loading = false;
    //     this.toasterService.showError("Failed to create checkout session");
    //   }
    // });
  }
}
