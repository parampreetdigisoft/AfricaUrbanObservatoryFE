import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { GetAssessmentQuestoinRequestDto } from 'src/app/core/models/AssessmentRequest';
import { GetAssessmentQuestionResponseDto } from 'src/app/core/models/AssessmentResponse';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { AnalystService } from '../../analyst.service';

@Component({
  selector: 'app-evaluator-response-view',
  templateUrl: './evaluator-response-view.component.html',
  styleUrl: './evaluator-response-view.component.css'
})
export class EvaluatorResponseViewComponent implements OnInit, OnDestroy {
  selectedPiller: PillarsVM | null = null;
  pillers: PillarsVM[] = [];
  selectedPillarId: number | any = '';
  userName: string | any = "";
  assessmentID: number | any = 0;
  questionResponse: PaginationResponse<GetAssessmentQuestionResponseDto> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1
 isLoader: boolean = false;
  constructor(private analystService: AnalystService, private userService: UserService, private toaster: ToasterService, private route: ActivatedRoute) { }
  ngOnDestroy(): void {
    this.userService.assessmentProgress.next(null);
  }
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.assessmentID = params.get('assessmentID');
      this.userName = params.get('userName');
    });
    this.getAssessmentQuestoins();
    this.GetAllPillars();
    this.getAssessmentProgressHistory();

  }

  GetAllPillars() {
    this.analystService.getAllPillars().subscribe(p => {
      this.pillers = p;
    });
  }

  getAssessmentQuestoins(currentPage: number = 1) {
      this.questionResponse = undefined;
      this.isLoader = true;
    let payload: GetAssessmentQuestoinRequestDto = {
      sortDirection: SortDirection.ASC,
      sortBy: 'questoinID',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID,
      assessmentID:this.assessmentID,
      pillarID:this.selectedPillarId
    }
    this.analystService.getAssessmentQuestoins(payload).subscribe(cities => {
      this.questionResponse = cities;
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;
    });
  }
  getAssessmentProgressHistory(){
    this.analystService.getAssessmentProgressHistory(this.assessmentID).subscribe(res=>{
     if(res.succeeded){
       this.userService.assessmentProgress.next(res.result);
     }
     else{
        this.toaster.showError("Failed to fetch assessment progress history");
     }
    });
  }

}