export interface AiCityPillarDashboardResponseDto {
  cityID: number;
  cityName: string;
  evaluationValue: number;
  aiValue: number;
  pillars: CityPillarDashboardPillarValueDto[];
}

export interface CityPillarDashboardPillarValueDto {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  evaluationValue: number;
  aiValue: number;
}
