import { TieredAccessPlanValue } from "src/app/core/enums/TieredAccessPlan";

export interface ICreateCheckoutSessionDto {
  userID: number;
  tier:TieredAccessPlanValue,
  amount:number
}

export interface IPlan {
  name:string,
  tier:TieredAccessPlanValue,
  amount:number
} 

