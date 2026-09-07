
export interface PaginationResponse<T> {
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}
