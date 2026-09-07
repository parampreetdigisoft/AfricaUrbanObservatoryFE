export interface CityDetailsDto {
  cityID: number;
  totalEvaluation: number;
  totalScore: number;
  scoreProgress: number;
  totalPillar: number;
  totalAnsPillar: number;
  totalQuestion: number;
  ansQuestion: number;
  avgHighScore: number;
  avgLowerScore: number;
  pillars: CityPillarDetailsDto[];
}

export interface CityPillarDetailsDto {
  pillarID: number;
  pillarName: string;
  totalScore: number;
  scoreProgress: number;
  totalPillar: number;
  totalAnsPillar: number;
  totalQuestion: number;
  ansQuestion: number;
  avgHighScore: number;
  avgLowerScore: number;
  totalUnKnown: number;
  totalNA: number;
  isAccess: number;
}
