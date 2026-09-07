import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { map } from 'rxjs';
import { AiCitySummeryDto } from '../models/aiVm/AiCitySummeryDto';
import { AiCitySummeryRequestDto, AiCityDocumentRequestDto, AiCityPillarDocumentRequestDto, AiPillarQuetionsRequestDto, DeleteCityDocumentRequestDto } from '../models/aiVm/AiCitySummeryRequestDto';
import { PaginationResponse } from '../models/PaginationResponse';
import { AiCityPillarResponseDto } from '../models/aiVm/AiCityPillarResponseDto';
import { ResultResponseDto } from '../models/ResultResponseDto';
import { AITrustLevelVM } from '../models/aiVm/AITrustLevelVM';
import { AIEstimatedQuestionScoreDto } from '../models/aiVm/AIEstimatedQuestionScoreDto';
import { AiCrossCityResponseDto } from '../models/aiVm/AiCrossCityResponseDto';
import { ChangedAiCityEvaluationStatusDto } from '../models/aiVm/ChangedAiCityEvaluationStatusDto';
import { RegenerateAiSearchDto } from '../models/aiVm/RegenerateAiSearchDto';
import { AiCitySummeryRequestPdfDto } from '../models/aiVm/AiCitySummeryRequestPdfDto';
import { DownloadReportDto } from '../models/aiVm/downloadReportDto';
import { AITransferAssessmentRequestDto } from '../models/aiVm/AITransferAssessmentRequestDto';
import { GetCityDocumentResponseDto, GetCityPillarDocumentResponseDto } from '../models/aiVm/GetCityDocumentResponseDto';

@Injectable({
  providedIn: 'root'
})
export class AiComputationService {

  constructor(private http: HttpService) { }

  public getAITrustLevels() {
    return this.http
      .get(`AiComputation/getAITrustLevels`)
      .pipe(map((x) => x as ResultResponseDto<AITrustLevelVM[]>));
  }

  public getAICities(request: AiCitySummeryRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICities`, request)
      .pipe(map((x) => x as PaginationResponse<AiCitySummeryDto>));
  }
  public getAICityPillars(request: AiCitySummeryRequestPdfDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICityPillars`,request)
      .pipe(map((x) => x as ResultResponseDto<AiCityPillarResponseDto>));
  }
  public getAIPillarQuestions(request: AiPillarQuetionsRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAIPillarQuestions`, request)
      .pipe(map((x) => x as PaginationResponse<AIEstimatedQuestionScoreDto>));
  }
  public aiCityDetailsReport(request:AiCitySummeryRequestPdfDto) {
    return this.http
      .ImportFile(`AiComputation/aiCityDetailsReport`,request);
  }
  public aiPillarDetailsReport(request:AiCitySummeryRequestPdfDto) {
    return this.http
      .ImportFile(`AiComputation/aiPillarDetailsReport`,request);
  }
  public getAICrossCityPillars(ids: number[]) {
    let payload = { cityIDs: ids };
    return this.http.post(`AiComputation/getAICrossCityPillars`, payload).pipe(map(x => x as ResultResponseDto<AiCrossCityResponseDto>));;
  }
  public changedAiCityEvaluationStatus(payload: ChangedAiCityEvaluationStatusDto) {
    return this.http.post(`AiComputation/changedAiCityEvaluationStatus`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public regenerateAiSearch(payload: RegenerateAiSearchDto) {
    return this.http.post(`AiComputation/regenerateAiSearch`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public addComment(payload: any) {
    return this.http.post(`AiComputation/addComment`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public regenerateSinglePillarAiSearch(payload: RegenerateAiSearchDto) {
    return this.http.post(`AiComputation/regeneratePillarAiSearch`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public aiAllCityDetailsReport(payload:DownloadReportDto) {
    return this.http
      .ImportFile(`AiComputation/aiAllCityDetailsReport`,payload);
  }
  public aiResultTransfer(payload:AITransferAssessmentRequestDto) {
    return this.http.post(`AiComputation/aiResultTransfer`, payload).pipe(map(x => x as ResultResponseDto<string>));;
  }
  public reCalculateKpis() {
    return this.http
      .get(`AiComputation/reCalculateKpis`)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public uploadAiDocuments(formdata: FormData) {
    return this.http
      .UploadFile(`AiComputation/uploadAiDocuments`, formdata)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }

  public getAICityDocuments(request: AiCityDocumentRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICityDocuments`, request)
      .pipe(map((x) => x as PaginationResponse<GetCityDocumentResponseDto>));
  }

  public getAICityPillarDocuments(request: AiCityPillarDocumentRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICityPillarDocuments`, request)
      .pipe(map((x) => x as ResultResponseDto<GetCityPillarDocumentResponseDto[]>));
  }

  public deleteDocument(request: DeleteCityDocumentRequestDto) {
    return this.http
      .post(`AiComputation/deleteDocument`, request)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }

  public downloadDocument(cityDocumentID: number) {
    return this.http
      .ImportFile(`AiComputation/downloadDocument/` + cityDocumentID);
  }
}
