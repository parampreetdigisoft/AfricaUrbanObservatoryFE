
export interface CityPillerRequestDto {
  cityID :number;
  userID: number;
  pillarID?: number;
}


export interface CityMappingPillerRequestDto {
  userCityMappingID: number;
  pillarID?: number;
}