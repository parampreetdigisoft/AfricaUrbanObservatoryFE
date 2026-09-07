export interface AIEstimatedQuestionScoreDto {
  cityId: number;
  pillarId: number;
  questionId: number;

  questionText: string;
  dataYear: number;

  aiScore: number | null;
  aiProgress: number | null;
  evaluatorProgress: number | null;
  discrepancy: number | null;

  confidenceLevel: string | null;
  dataSourcesUsed: number | null;

  evidenceSummary: string | null;
  redFlags: string | null;
  geographicEquityNote: string | null;

  sourceType: string | null;
  sourceName: string | null;
  sourceURL: string | null;
  sourceDataYear: number | null;
  sourceDataExtract: string | null;
  sourceTrustLevel: number | null;
  updatedAt: Date;
}
