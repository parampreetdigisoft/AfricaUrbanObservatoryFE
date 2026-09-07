import { PaginationRequest } from "../PaginationRequest";

export interface AiCitySummeryRequestDto extends PaginationRequest {
  cityID?:number;
  year?:number
}

export interface AiPillarQuetionsRequestDto extends AiCitySummeryRequestDto {
  pillarID?:number;
}

export interface AiCityDocumentRequestDto extends PaginationRequest {
  cityID?:number;
}

export interface AiCityPillarDocumentRequestDto {
  cityID: number;
}

export interface DeleteCityDocumentRequestDto {
  cityID: number;
  cityDocumentID?: number;
  isAll?: boolean;
}