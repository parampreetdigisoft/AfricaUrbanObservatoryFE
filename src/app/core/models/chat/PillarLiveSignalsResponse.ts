export interface PillarLiveSignalCard {
  pillarId: number;
  pillarName?: string;
  imagePath?: string;
  type: 'risk' | 'trend';
  title: string;
  summary: string;
  status: string;
  urgency: string;
  color: string;
  sourceUrl: string;
}

export interface PillarLiveSignalsResult {
  updatedAt: string;
  headline: string;
  subHeadline: string;
  pillars: PillarLiveSignalCard[];
}
