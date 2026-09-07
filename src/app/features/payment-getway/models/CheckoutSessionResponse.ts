import { PaymentStatus } from "src/app/core/enums/TieredAccessPlan";

export interface CheckoutSessionResponse {
  sessionId: string;
  customerId: string;   // ISO date string from backend
  currency: string ;
  amountTotal: number;
  created: string;
}

export interface VerifySessionResponse {
  sessionId: string;
  paymentStatus: PaymentStatus;  
  currency: string ;
  amountTotal: number;
}