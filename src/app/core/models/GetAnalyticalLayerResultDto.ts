import { CityVM } from "./CityVM";
import { PaginationUserRequest } from "./PaginationRequest";

export interface GetAnalyticalLayerRequestDto extends PaginationUserRequest {
  layerID?: number ;
  cityID?:number;
  year?:number;
}

export interface GetAnalyticalLayerResultDto extends AnalyticalLayerResponseDto {
  layerResultID: number;
  cityID: number;
  interpretationID?: number | null;
  normalizeValue?: number | null;
  calValue1?: number ;
  calValue2?: number ;
  calValue3?: number ;
  calValue4?: number ;
  calValue5?: number ;
  lastUpdated: string; 

  aiInterpretationID?: number | null;
  aiNormalizeValue?: number | null;
  aiCalValue1?: number ;
  aiCalValue2?: number ;
  aiCalValue3?: number ;
  aiCalValue4?: number ;
  aiCalValue5?: number ;
  aiLastUpdated?: string; 

  fiveLevelInterpretations: FiveLevelInterpretation[];
  city?: CityVM | null;
}

export interface AnalyticalLayerResponseDto {
  layerID: number;
  layerCode: string;
  layerName: string;
  purpose: string;
  calText1: string;
  calText2: string;
  calText3: string;
  calText4: string;
  calText5: string;
}

export interface FiveLevelInterpretation {
  interpretationID: number;
  layerID: number;
  minRange: number;
  maxRange: number;
  condition: string;
  descriptor: string;
  urbanSignal: string;
  strategicAction: string;
}
