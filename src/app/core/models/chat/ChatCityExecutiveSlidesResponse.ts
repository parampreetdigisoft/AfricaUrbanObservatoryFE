export interface PerformanceSummary {
  trend: string;
  summary: string;
}

export interface CombinedRiskItem {
  rank: number;
  title: string;
  riskScore: number;
  severity: string;
  trend: string;
  description: string;
  recommendation: string;
}

export interface EarlyWarningItem {
  title: string;
  description: string;
  timeframe: string;
  impactLevel: string;
}

export interface CityExecutiveSlidesResult {
   city: CityRankingResponseDto;

  recentPerformance: PerformanceSummary;

  combinedRisks: CombinedRiskItem[];

  earlyWarnings: EarlyWarningItem[];
}

export interface ChatCityExecutiveSlidesResponse {
  success: boolean;
  message: string;
  result: CityExecutiveSlidesResult;
}

export interface CityRankingResponseDto {
  cityID: number;
  cityName: string;
  region: string;
  state: string;
  country:string;
  totalCity: number;
  cityRank: number;
  totalCityInCountry: number;
  countryRank: number;
  cityAIScore?: number;
  dataYear?: number;
  pillars: PillarsUserHistoryResponseDto[];
}

export interface PillarsUserHistoryResponseDto {
  pillarID: number;
  pillarName: string;
  imagePath: string;
  pillarScore: number;
  displayOrder: number;
}