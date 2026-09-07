import {  TieredAccessPlanValue } from "src/app/core/enums/TieredAccessPlan";

export interface UserCityGetPillarInfoRequstDto {
    userID?: number;
    cityID: number;
    pillarID: number;
    updatedAt?: string;
    Tiered?:TieredAccessPlanValue
}