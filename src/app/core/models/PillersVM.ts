export interface PillarsVM {
  pillarID: number;
  pillarName: string;
  description: string;
  displayOrder: number;
  imagePath?:string;
  weight: number;
  reliability: boolean;
  expand?: boolean;
  showToggle?: boolean;
}