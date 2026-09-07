import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { HttpService } from 'src/app/core/http/http.service';
import { UserService } from 'src/app/core/services/user.service';
import { CityVM } from '../../core/models/CityVM';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';
import { CityHistoryDto, CityPillarHistoryReponseDto, GetCitiesSubmitionHistoryReponseDto, GetCityQuestionHistoryReponseDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { GetCityPillarHistoryRequestDto } from 'src/app/core/models/AssessmentRequest';
import { PillarsHistoryResponse } from 'src/app/core/models/PillarsUserHistoryResponse';
import { QuestionsByUserPillarsResponsetDto } from 'src/app/core/models/GetQuestionHistoryResponseDto ';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { CityDetailsDto } from './models/CityDetailsDto';
import { UserCityGetPillarInfoRequstDto } from './models/UserCityGetPillarInfoRequstDto';
import { CityPillarQuestionDetailsDto } from './models/CityPillarQuestionDetailsDto';
import { AnalyticalLayerResponseDto, GetAnalyticalLayerRequestDto, GetAnalyticalLayerResultDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { CompareCityResponseDto } from 'src/app/core/models/CompareCityResponseDto';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { AiCityPillarResponseDto } from 'src/app/core/models/aiVm/AiCityPillarResponseDto';
import { AiCitySummeryRequestPdfDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestPdfDto';
import { GetMutiplekpiLayerRequestDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerRequestDto';
import { GetMutiplekpiLayerResultsDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto';

@Injectable({
  providedIn: 'root'
})
export class CityUserService {

  public userCityMappingIDSubject$ = new BehaviorSubject<number | null>(null);

  constructor(private http: HttpService, private userService: UserService) { }
  public getAllPillars() {
    return this.http.get(`Public/GetAllPillarAsync`).pipe(map(x => x as ResultResponseDto<PillarsVM[]>));
  }
   public getCityUserAllPillars() {
    return this.http.get(`CityUser/GetAllPillarAsync`).pipe(map(x => x as ResultResponseDto<PillarsVM[]>));
  }
  public getAllCities() {
    return this.http.get(`Public/getAllCities`).pipe(map(x => x as ResultResponseDto<CityVM[]>));
  }
  public getCityUserCities() {
    return this.http.get(`CityUser/getCityUserCities`).pipe(map(x => x as ResultResponseDto<CityVM[]>));
  }
  public getCityHistory() {
    return this.http.get(`CityUser/getCityHistory`).pipe(map(x => x as ResultResponseDto<CityHistoryDto>));
  }
  public getCitiesProgressByUserId() {
    return this.http.get(`CityUser/getCitiesProgressByUserId`).pipe(map(x => x as ResultResponseDto<GetCitiesSubmitionHistoryReponseDto[]>));
  }
  public getCityQuestionHistory(request: UserCityRequstDto) {
    return this.http.getWithQueryParams(`CityUser/getCityQuestionHistory`, request).pipe(map(x => x as GetCityQuestionHistoryReponseDto));
  }
  public getCities(request: PaginationUserRequest) {
    return this.http.getWithQueryParams(`CityUser/cities`, request).pipe(map(x => x as PaginationResponse<CityVM>));;
  }
  public getCityDetails(request: UserCityRequstDto) {
    return this.http.getWithQueryParams(`CityUser/getCityDetails`, request).pipe(map(x => x as ResultResponseDto<CityDetailsDto>));
  }
  public getCityPillarDetails(request: UserCityGetPillarInfoRequstDto) {
    return this.http.getWithQueryParams(`CityUser/GetCityPillarDetails`, request).pipe(map(x => x as ResultResponseDto<CityPillarQuestionDetailsDto[]>));
  }
  public getCityUserKpi() {
    return this.http.get(`CityUser/getCityUserKpi`).pipe(map(x => x as ResultResponseDto<AnalyticalLayerResponseDto[]>));;
  }
  public addCityUserKpisCityAndPillar(request: any) {
    return this.http.post(`CityUser/addCityUserKpisCityAndPillar`, request).pipe(map(x => x as ResultResponseDto<string>));
  }
  public compareCities(request: CompareCityRequestDto) {
    return this.http.post(`CityUser/compareCities`, request).pipe(map(x => x as ResultResponseDto<CompareCityResponseDto>));
  }
  public getAICityPillars(request: AiCitySummeryRequestPdfDto) {
    return this.http
      .getWithQueryParams(`CityUser/getAICityPillars`,request)
      .pipe(map((x) => x as ResultResponseDto<AiCityPillarResponseDto>));
  }

  public getAllCitiesByUserId(userId: number) {
    return this.http.get(`City/getAllCityByUserId/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }

  public exportPillarsHistoryByUserId(request: GetCityPillarHistoryRequestDto) {
    return this.http.ImportFile(`Pillar/ExportPillarsHistoryByUserId`, request);
  }
  public getQuestionsHistoryByPillar(request: GetCityPillarHistoryRequestDto) {
    return this.http.getWithQueryParams(`Question/getQuestionsHistoryByPillar`, request).pipe(map(x => x as ResultResponseDto<QuestionsByUserPillarsResponsetDto[]>));
  }

  public GetAnalyticalLayerResults(request: GetAnalyticalLayerRequestDto) {
    return this.http.getWithQueryParams(`Kpi/GetAnalyticalLayerResults`, request).pipe(map(x => x as PaginationResponse<GetAnalyticalLayerResultDto>));;
  }
  public GetAllKpi() {
    return this.http.get(`Kpi/GetAllKpi`).pipe(map(x => x as ResultResponseDto<AnalyticalLayerResponseDto[]>));;
  }
  public getMutiplekpiLayerResults(payload: GetMutiplekpiLayerRequestDto) {
    return this.http.post(`kpi/getMutiplekpiLayerResults`, payload).pipe(map(x => x as ResultResponseDto<GetMutiplekpiLayerResultsDto>));;
  }
  public exportCompareCities(params: any) {
    return this.http.ImportFile(`CityUser/ExportCompareCities`, params);
  }
}
