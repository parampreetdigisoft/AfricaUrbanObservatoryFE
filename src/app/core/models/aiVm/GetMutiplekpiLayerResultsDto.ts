import { CityVM } from "../CityVM";
import { FiveLevelInterpretation } from "../GetAnalyticalLayerResultDto";

export interface GetMutiplekpiLayerResultsDto {
  layerID: number;
  layerCode: string;
  layerName: string;
  purpose: string;

  calText1?: string | null;
  calText2?: string | null;
  calText3?: string | null;
  calText4?: string | null;
  calText5?: string | null;

  cities: MutipleCitieskpiLayerResults[];

  fiveLevelInterpretations: FiveLevelInterpretation[];
}

export interface MutipleCitieskpiLayerResults {
  layerResultID: number;
  cityID: number;

  interpretationID?: number | null;
  normalizeValue?: number | null;

  calValue1?: number | null;
  calValue2?: number | null;
  calValue3?: number | null;
  calValue4?: number | null;
  calValue5?: number | null;

  lastUpdated: string; // ISO date string

  aiInterpretationID?: number | null;
  aiNormalizeValue?: number | null;

  aiCalValue1?: number | null;
  aiCalValue2?: number | null;
  aiCalValue3?: number | null;
  aiCalValue4?: number | null;
  aiCalValue5?: number | null;

  aiLastUpdated?: string | null;

  city?: CityVM;
}
