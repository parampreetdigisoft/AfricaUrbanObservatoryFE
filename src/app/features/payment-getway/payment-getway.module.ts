import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/share.module';
import { RouterModule, Routes } from '@angular/router';
import { PaymentComponent } from './payment/payment.component';
import { PlansComponent } from './container/plans/plans.component';
import { PaymentSuccessComponent } from './container/payment-success/payment-success.component';
import { PaymentCancelComponent } from './container/payment-cancel/payment-cancel.component';
import { NgxStripeModule } from 'ngx-stripe';

const routes: Routes = [
  {
    path: '',
    component: PaymentComponent,
    data: { roles: [] },
    children: [
      { path: '', redirectTo: 'plan', pathMatch: 'full' }, 
      { path: 'plan', component: PlansComponent ,data: { roles: 'plan'}},
      { path: 'payment-success', component: PaymentSuccessComponent ,data: { roles: 'payment-success'}},
      { path: 'payment-cancel', component: PaymentCancelComponent ,data: { roles: 'payment-cancel'}}
    ]
  }
];

@NgModule({
  declarations: [
      PaymentComponent,
      PlansComponent,
      PaymentSuccessComponent,
      PaymentCancelComponent
    ],
  imports: [
    CommonModule,
    SharedModule,
    NgxStripeModule,
    RouterModule.forChild(routes)
  ]
})

export class PaymentGetwayModule { }
