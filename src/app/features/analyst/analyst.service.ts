import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { HttpService } from 'src/app/core/http/http.service';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { UserService } from 'src/app/core/services/user.service';
import { CityVM } from '../../core/models/CityVM';
import { GetUserByRoleRequestDto, GetUserByRoleResponse } from '../../core/models/GetUserByRoleResponse';
import { InviteBulkUserDto, InviteUserDto, SendRequestMailToUpdateCity, UpdateInviteUserDto } from '../../core/models/AnalystVM';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';
import { CityMappingPillerRequestDto} from 'src/app/core/models/QuestionRequest';
import { AddAssessmentDto, ChangeAssessmentStatusRequestDto, GetAssessmentQuestoinRequestDto, GetAssessmentRequestDto, GetCityPillarHistoryRequestDto, GetCityPillarHistoryRequestNewDto, TransferAssessmentRequestDto } from 'src/app/core/models/AssessmentRequest';
import { AssessmentWithProgressVM, GetAssessmentQuestionResponseDto, GetAssessmentResponse } from 'src/app/core/models/AssessmentResponse';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { GetQuestionByCityMappingRespones } from 'src/app/core/models/QuestonResponse';
import { GetAssignUserDto, PublicUserResponse } from 'src/app/core/models/UserInfo';
import { CityHistoryDto, GetCitiesSubmitionHistoryReponseDto, UserCityPillarDashboardRequstDto } from 'src/app/core/models/cityHistoryDto';
import { QuestionsByUserPillarsResponsetDto } from 'src/app/core/models/GetQuestionHistoryResponseDto ';
import { PillarsHistoryResponse } from 'src/app/core/models/PillarsUserHistoryResponse';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { CompareCityResponseDto } from 'src/app/core/models/CompareCityResponseDto';
import { GetAnalyticalLayerRequestDto, GetAnalyticalLayerResultDto, AnalyticalLayerResponseDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { AiCityPillarDashboardResponseDto } from 'src/app/core/models/AiCityPillarDashboardResponseDto';
import { GetMutiplekpiLayerRequestDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerRequestDto';
import { GetMutiplekpiLayerResultsDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto';

@Injectable({
  providedIn: 'root'
})
export class AnalystService {

  public userCityMappingIDSubject$ = new BehaviorSubject<number | null>(null);


  constructor(private http: HttpService, private userService: UserService) { }
  public getCities(request: PaginationUserRequest) {
    return this.http.getWithQueryParams(`City/cities`, request).pipe(map(x => x as PaginationResponse<CityVM>));;
  }
  public getAllCitiesByUserId(userId: number) {
    return this.http.get(`City/getAllCityByUserId/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
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
  public addEvaluator(data: InviteUserDto) {
    return this.http.post(`Auth/InviteUser`, data).pipe(map(x => x as ResultResponseDto<unknown>));

  }
  public addBulkEvaluator(data: InviteBulkUserDto) {
    return this.http.post(`Auth/InviteBulkUser`, data).pipe(map(x => x as ResultResponseDto<unknown>));
  }
  public editEvaluator(data: UpdateInviteUserDto) {
    return this.http.post(`Auth/UpdateInviteUser`, data).pipe(map(x => x as ResultResponseDto<unknown>));
  }
  public sendMailForEditAssessment(data: SendRequestMailToUpdateCity) {
    return this.http.post(`Auth/sendMailForEditAssessment`, data).pipe(map(x => x as ResultResponseDto<string>));
  }

  public deleteEvaluator(id: number) {
    return this.http.delete(`Auth/deleteUser` + id).pipe(map(x => x as ResultResponseDto<boolean>));
  }
  public unAssignCity(data: any) {
    return this.http.post(`City/unAssignCity`, data).pipe(map(x => x as ResultResponseDto<unknown>));
  }
  public getCitiesProgressByUserId(userID: number, updatedAt: string) {
    return this.http.get(`City/getCitiesProgressByUserId/`+ updatedAt).pipe(map(x => x as ResultResponseDto<GetCitiesSubmitionHistoryReponseDto[]>));
  }
  public getAllPillars() {
    return this.http.get(`Pillar/Pillars`).pipe(map(x => x as PillarsVM[]));
  }
  public exportPillarsHistoryByUserId(request: GetCityPillarHistoryRequestDto) {
    return this.http.ImportFile(`Pillar/ExportPillarsHistoryByUserId`, request);
  }
  public getQuestionsByCityId(payload: CityMappingPillerRequestDto) {
    return this.http.getWithQueryParams(`Question/getQuestionsByCityMappingIdForAnalyst`, payload).pipe(map(x => x as ResultResponseDto<GetQuestionByCityMappingRespones>));
  }
  public ExportQuestions(userCityMappingID: number) {
    return this.http.ImportFile(`Question/ExportAssessment/` + userCityMappingID);
  }
  public getQuestionsHistoryByPillar(request: GetCityPillarHistoryRequestDto) {
    return this.http.getWithQueryParams(`Question/getQuestionsHistoryByPillar`, request).pipe(map(x => x as ResultResponseDto<QuestionsByUserPillarsResponsetDto[]>));
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
  public changeAssessmentStatus(request: ChangeAssessmentStatusRequestDto) {
    return this.http.post(`AssessmentResponse/changeAssessmentStatus`, request).pipe(map(x => x as ResultResponseDto<string>));
  }
  public transferAssessment(request: TransferAssessmentRequestDto) {
    return this.http.post(`AssessmentResponse/transferAssessment`, request).pipe(map(x => x as ResultResponseDto<string>));
  }
  public getCityPillarHistory(request: UserCityPillarDashboardRequstDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getCityPillarHistory`, request).pipe(map(x => x as ResultResponseDto<AiCityPillarDashboardResponseDto>));
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
  public getResponsesByUserId(request: GetCityPillarHistoryRequestNewDto) {
    return this.http.post(`Pillar/GetResponsesByUserId`, request).pipe(map(x => x as PaginationResponse<PillarsHistoryResponse>));
  }

  public GetEvaluatorByAnalyst(payload: GetAssignUserDto) {
    return this.http.getWithQueryParams(`User/GetEvaluatorByAnalyst`, payload).pipe(map(x => x as ResultResponseDto<PublicUserResponse[]>));
  }
  public getMutiplekpiLayerResults(payload: GetMutiplekpiLayerRequestDto) {
    return this.http.post(`kpi/getMutiplekpiLayerResults`, payload).pipe(map(x => x as ResultResponseDto<GetMutiplekpiLayerResultsDto>));;
  }
}
