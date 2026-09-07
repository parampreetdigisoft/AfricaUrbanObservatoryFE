export interface AiCrossCityResponseDto {
  categories: string[];
  series: ChartSeriesDto[];
  tableData: ChartTableRowDto[];
}
export interface ChartSeriesDto {
  name: string;
  data: number[];
}
export interface PillarValueDto {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  value: number;
  isAccess: boolean;
  imagePath:string;
}
export interface ChartTableRowDto {
  cityID: number;
  cityName: string;
  updatedAt: string;
  value: number;
  pillarValues: PillarValueDto[];
}

export interface PillarWiseScoreDto {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  isAccess: boolean;
  imagePath:string;
  values: {
    cityID: number;
    cityName: string;
    value: number;
  }[];
}

