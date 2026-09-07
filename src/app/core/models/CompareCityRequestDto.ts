import { PaginationRequest } from "./PaginationRequest";

export interface CompareCityRequestDto extends PaginationRequest{
  cities: number[];
  Kpis?: number[];
  updatedAt?: Date; 
}
