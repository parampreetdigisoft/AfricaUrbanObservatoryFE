import { AITrustLevelVM } from "./AITrustLevelVM";


export interface AiCityPillarResponseDto {
  pillars: AiCityPillarVM[];
}
export interface AiCityPillarVM {
  pillarScoreID: number;
  cityID: number;
  pillarID: number;
  pillarName: string;
  description: string;
  displayOrder: number;
  imagePath: string;

  isAccess: boolean;
  aiDataYear: number;
  aiScore?: number | null;
  aiProgress?: number | null;
  evaluatorProgress?: number | null;
  discrepancy?: number | null;
  confidenceLevel?: string | null;
  evidenceSummary: string | null;
  redFlags?: string | null;
  geographicEquityNote?: string | null;
  institutionalAssessment?: string | null;
  dataGapAnalysis?: string | null;
  dataSourceCitations?: AIDataSourceCitation[] | null;
  updatedAt:Date
  aiCompletionRate?:number
}

export interface AIDataSourceCitation {
  citationID: number;
  pillarScoreID?: number | null;
  sourceType: string;
  sourceName: string;
  sourceURL: string;
  dataYear?: number | null;
  dataExtract?: string | null;
  trustLevel?: number | null;
  createdAt?: string | null; // ISO string from API
}

