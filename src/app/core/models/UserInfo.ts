import { TieredAccessPlanValue } from "../enums/TieredAccessPlan";

export interface UserInfo extends PublicUserResponse,PublicUserLocalStorageResponse {
  tokenExpirationDate: Date;
  tier:TieredAccessPlanValue
}
export interface PublicUserResponse {
  userID: number;
  fullName: string;
  email: string;
  phone?: string | null;
  isDeleted: boolean;
  role: string;
  createdBy?: number | null;
  createdByName?: string | null;
  createdAt: string; // or Date if you plan to convert to Date object
  isEmailConfirmed: boolean;
  isLoggedIn: boolean;
  is2FAEnabled?: boolean;
}
export interface PublicUserLocalStorageResponse {
  isActive: boolean;
  profileImagePath: string;
  token: string;
  rememberMe:boolean
}

export interface RolePermission {
  menuName:string,
  status:boolean
}
export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface GetAssignUserDto {
  userID: number;
  searchUserID?: number;
  cityID?: number;
}
export interface UpdateUserResponseDto {
  userID: number;
  fullName: string;
  phone: string;
  email: string;
  profileImagePath: string;
  tier:TieredAccessPlanValue
}