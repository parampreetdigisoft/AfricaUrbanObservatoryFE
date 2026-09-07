import { inject, Injectable } from '@angular/core';
import { HttpService } from 'src/app/core/http/http.service';
import { ICreateCheckoutSessionDto } from './models/ICreateCheckoutSessionDto';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';
import { CheckoutSessionResponse, VerifySessionResponse } from './models/CheckoutSessionResponse';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  http = inject(HttpService);

  createCheckoutSession(payload: ICreateCheckoutSessionDto) {
    return this.http.post('Payment/create-checkout-session', payload).pipe(map((x) => x as ResultResponseDto<CheckoutSessionResponse>));
  }

  verifySession(payload: any) {
    return this.http.post(`Payment/verify-session`, payload).pipe(map((x) => x as ResultResponseDto<VerifySessionResponse>));;
  }
}
