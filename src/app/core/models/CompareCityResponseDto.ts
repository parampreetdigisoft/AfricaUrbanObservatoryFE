export interface CompareCityResponseDto {
  categories: string[];
  series: ChartSeriesDto[];
  tableData: ChartTableRowDto[];
}

export interface ChartSeriesDto {
  name: string;
  data: number[];
  aiData: number[];
}

export interface ChartTableRowDto {
  layerID: number;
  layerCode: string;
  layerName: string;
  cityValues: CityValueDto[];
  peerCityScore: number;
}

export interface CityValueDto {
  cityID: number;
  cityName: string;
  value: number;
  aiValue: number;
}
