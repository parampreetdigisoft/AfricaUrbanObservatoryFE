export interface CityVM extends AddUpdateCityDto {
  isActive: boolean;
  createdDate: string;   // ISO date string from backend
  updatedDate?: string | null;
  isDeleted: boolean;
  assignedBy?: string;
  image?: string;
  userCityMappingID?:number;
  score?: number;
  progress?: number;
  aiScore?: number;
  selected:boolean;
}
export interface AddUpdateCityDto {
  cityID: number;
  country: string;
  state: string;
  cityName: string;
  cityAliasName?: string;
  postalCode: string;
  region: string;
  imageFile: string;
  imageUrl: string;
  longitude: number;
  latitude: number;
  population: number;
  income: number;
  livingCost: number;
  purchasingPower: number;
  peerCitiesIDs: number;
}

export interface BulkAddCityDto {
  cities : CityVM[]
}