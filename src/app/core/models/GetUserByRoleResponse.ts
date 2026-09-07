import { UserRoleValue } from "src/app/core/enums/UserRole";
import { PaginationRequest } from "src/app/core/models/PaginationRequest";
import { PublicUserResponse } from "src/app/core/models/UserInfo";
import { AddUpdateCityDto } from "./CityVM";

export interface GetUserByRoleResponse  extends PublicUserResponse {
  cities: AddUpdateCityDto[];
}


export interface GetUserByRoleRequestDto extends PaginationRequest{
  userID: number;
  getUserRole?:UserRoleValue;
}