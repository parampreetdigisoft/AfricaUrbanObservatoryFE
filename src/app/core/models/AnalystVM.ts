import { TieredAccessPlanValue } from "../enums/TieredAccessPlan";

export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: number;
  tier?: TieredAccessPlanValue | TieredAccessPlanValue.Pending;
  pillars?: number[] | [];
}

export interface InviteUserDto extends RegisterDto {
  invitedUserID: number;
  cityID: number[];
  isAllCities?: boolean;
}

export interface UpdateInviteUserDto extends InviteUserDto {
  userID: number;
}
export interface InviteBulkUserDto {
  users: InviteUserDto[];
}
export interface SendRequestMailToUpdateCity {
    userID: number;
    mailToUserID: number;
    userCityMappingID: number;
}
