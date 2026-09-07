import { AssessmentPhase } from "../enums/AssessmentPhase";
import { UserRoleValue } from "../enums/UserRole";
import { PaginationUserRequest } from "./PaginationRequest";


export interface AddAssessmentDto {
  assessmentID: number;
  userCityMappingID: number;
  pillarID: number;
  responses: AddAssessmentResponseDto[];
  isAutoSave:boolean;
  isFinalized:boolean;
}

export interface AddAssessmentResponseDto {
  responseID: number;
  assessmentID: number;
  questionID: number;
  questionOptionID: number;
  score?: number | null;
  justification: string;
}

export interface GetAssessmentQuestoinRequestDto extends PaginationUserRequest{
  pillarID?: number | null;
  assessmentID: number;
}


export interface GetAssessmentRequestDto extends PaginationUserRequest{
  subUserID?: number | null;
  cityID?: number | null;
  role?: UserRoleValue | null;
  updatedAt?: string;
}


export interface GetCityPillarHistoryRequestDto {
  cityID: number;
  userID: number;
  pillarID?: number;
  updatedAt:string;
  exportType?:string
}
export interface GetCityPillarHistoryRequestNewDto extends PaginationUserRequest {
  cityID: number;
  pillarID?: number;
  updatedAt:string;
}
export interface ChangeAssessmentStatusRequestDto {
  assessmentID: number;
  userID: number;
  assessmentPhase?: AssessmentPhase;
}
export interface TransferAssessmentRequestDto {
  assessmentID: number;
  transferToUserID: number;
}
