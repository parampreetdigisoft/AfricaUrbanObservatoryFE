import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/http/http.service';
import { SendRequestMailToUpdateCity } from 'src/app/core/models/AnalystVM';
import { AddAssessmentDto, GetAssessmentQuestoinRequestDto, GetAssessmentRequestDto } from 'src/app/core/models/AssessmentRequest';
import { AssessmentWithProgressVM, GetAssessmentQuestionResponseDto, GetAssessmentResponse } from 'src/app/core/models/AssessmentResponse';
import { CityHistoryDto, GetCityQuestionHistoryReponseDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { CityVM } from 'src/app/core/models/CityVM';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { CompareCityResponseDto } from 'src/app/core/models/CompareCityResponseDto';
import { GetAnalyticalLayerRequestDto, GetAnalyticalLayerResultDto, AnalyticalLayerResponseDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { GetUserByRoleRequestDto, GetUserByRoleResponse } from 'src/app/core/models/GetUserByRoleResponse';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { CityMappingPillerRequestDto } from 'src/app/core/models/QuestionRequest';
import { GetQuestionByCityMappingRespones } from 'src/app/core/models/QuestonResponse';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  constructor(private http: HttpService) { }

  public userCityMappingIDSubject$ = new BehaviorSubject<number | null>(null);

  public sendMailForEditAssessment(data: SendRequestMailToUpdateCity) {
    return this.http.post(`Auth/sendMailForEditAssessment`, data).pipe(map(x => x as ResultResponseDto<string>));
  }

  public getCities(request: PaginationUserRequest) {
    return this.http.getWithQueryParams(`City/cities`, request).pipe(map(x => x as PaginationResponse<CityVM>));;
  }
  public getAllCitiesByUserId(userId: number) {
    return this.http.get(`City/getAllCityByUserId/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getAiAccessCity(userId: number) {
    return this.http.get(`City/getAiAccessCity`).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getCityByUserIdForAssessment(userId: number) {
    return this.http.get(`City/getCityByUserIdForAssessment/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getCityHistory(userID: number, updatedAt: string) {
    return this.http.get(`City/getCityHistory/` + updatedAt).pipe(map(x => x as ResultResponseDto<CityHistoryDto>));
  }
  public getEvaluator(request: GetUserByRoleRequestDto) {
    return this.http.getWithQueryParams(`User/GetUserByRoleWithAssignedCity`, request).pipe(map(x => x as PaginationResponse<GetUserByRoleResponse>));
  }

  public getAllPillars() {
    return this.http.get(`Pillar/Pillars`).pipe(map(x => x as PillarsVM[]));
  }

  public saveAssessment(payload: AddAssessmentDto) {
    return this.http.post(`AssessmentResponse/saveAssessment`, payload).pipe(map(x => x as ResultResponseDto<string>));
  }
  public getAssessmentResults(payload: GetAssessmentRequestDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getAssessmentResults`, payload).pipe(map(x => x as PaginationResponse<GetAssessmentResponse>));
  }
  public getAssessmentQuestoins(payload: GetAssessmentQuestoinRequestDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getAssessmentQuestoins`, payload).pipe(map(x => x as PaginationResponse<GetAssessmentQuestionResponseDto>));
  }
  public ImportAssessment(formData: FormData) {
    return this.http.UploadFile(`AssessmentResponse/ImportAssessment`, formData).pipe(map(x => x as ResultResponseDto<string>));;
  }
  public getAssessmentProgressHistory(assessmentID: number) {
    return this.http.get(`AssessmentResponse/getAssessmentProgressHistory/` + assessmentID).pipe(map(x => x as ResultResponseDto<AssessmentWithProgressVM>));
  }
  public getCityQuestionHistory(request: UserCityRequstDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getCityQuestionHistory`, request).pipe(map(x => x as GetCityQuestionHistoryReponseDto));
  }
  public getQuestionsByCityId(payload: CityMappingPillerRequestDto) {
    return this.http.getWithQueryParams(`Question/getQuestionsByCityMappingId`, payload).pipe(map(x => x as ResultResponseDto<GetQuestionByCityMappingRespones>));
  }
  public ExportQuestions(userCityMappingID: number) {
    return this.http.ImportFile(`Question/ExportAssessment/` + userCityMappingID);
  }
  public GetAnalyticalLayerResults(request: GetAnalyticalLayerRequestDto) {
    return this.http.getWithQueryParams(`Kpi/GetAnalyticalLayerResults`, request).pipe(map(x => x as PaginationResponse<GetAnalyticalLayerResultDto>));;
  }
  public GetAllKpi() {
    return this.http.get(`Kpi/GetAllKpi`).pipe(map(x => x as ResultResponseDto<AnalyticalLayerResponseDto[]>));;
  }
  public compareCities(request: CompareCityRequestDto) {
    return this.http.post(`Kpi/compareCities`, request).pipe(map(x => x as ResultResponseDto<CompareCityResponseDto>));
  }
}
