import { Component, OnInit } from "@angular/core";
import { CityVM } from "src/app/core/models/CityVM";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { ActivatedRoute, Router } from "@angular/router";
import { GetAssessmentResponse } from "src/app/core/models/AssessmentResponse";
import {
  ChangeAssessmentStatusRequestDto,
  GetAssessmentRequestDto,
  TransferAssessmentRequestDto,
} from "src/app/core/models/AssessmentRequest";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { AnalystService } from "../../analyst.service";
import {
  GetAssignUserDto,
  PublicUserResponse,
} from "src/app/core/models/UserInfo";
import {
  AssessmentPhase } from "src/app/core/enums/AssessmentPhase";
import { CommonService } from "src/app/core/services/common.service";
import { SendRequestMailToUpdateCity } from "src/app/core/models/AnalystVM";

@Component({
  selector: "app-evaluator-responses",
  templateUrl: "./evaluator-responses.component.html",
  styleUrl: "./evaluator-responses.component.css",
})
export class EvaluatorResponsesComponent implements OnInit {
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedcityID: number | any = "";
  selecteduserID: number | any = "";
  selectedAssessment: GetAssessmentResponse | any = "";
  changeAssessment: ChangeAssessmentStatusRequestDto | any = "";
  assessmentsResponse: PaginationResponse<GetAssessmentResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  cities: CityVM[] | null = [];
  evaluators: PublicUserResponse[] | null = [];
  assessmentUserID: number | any = 0;
  isLoader: boolean = false;
  constructor(
    private analystService: AnalystService,
    private userService: UserService,
    private toaster: ToasterService,
    public commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.assessmentUserID = params.get("assessmentUserID");
      let uid = params.get("userID");
      let cid = params.get("cityID");
      if (uid && cid && !this.assessmentUserID) {
        this.selectedcityID = cid;
        this.selecteduserID = uid;
      }
    });
    this.getAllCitiesByUserId();

    if (!this.assessmentUserID) {
      this.GetEvaluatorByAnalyst();
    }
    this.getAssessments();
  }

  goToAssessment(assessment: GetAssessmentResponse) {
    this.router.navigate([
      "/analyst/assessment-result",
      assessment.assessmentID,
      assessment.userName,
    ]);
  }

  ngOnDestroy(): void {}

  assessmentPhaseAction(assessment: GetAssessmentResponse) {
    switch (assessment.assessmentPhase) {
      case AssessmentPhase.InProgress: {
        if (this.assessmentUserID) {
          this.analystService.userCityMappingIDSubject$.next(
            assessment.userCityMappingID
          );
          this.router.navigate(["analyst/analyst-assessment"]);
        }
        break;
      }
      case AssessmentPhase.EditApproved: {
        if (this.assessmentUserID) {
          this.analystService.userCityMappingIDSubject$.next(
            assessment.userCityMappingID
          );
          this.router.navigate(["analyst/analyst-assessment"]);
        }
        break;
      }
      case AssessmentPhase.EditRequested:
        break;
      case AssessmentPhase.EditRejected: {
        this.sendMailForEditAssessment(
          assessment.userCityMappingID,
          assessment.assignedByUserId
        );
        break;
      }
      case AssessmentPhase.Completed: {
        if (this.assessmentUserID) {
          this.sendMailForEditAssessment(
            assessment.userCityMappingID,
            assessment.assignedByUserId
          );
        }
        break;
      }
    }
  }
  getAssessments(currentPage: number = 1) {
    this.assessmentsResponse = undefined;
    this.isLoader = true;
    let payload: GetAssessmentRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "createdAt",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID,
      cityID: this.selectedcityID,
      subUserID: this.assessmentUserID
        ? this.assessmentUserID
        : this.selecteduserID,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
    };
    this.analystService
      .getAssessmentResults(payload)
      .subscribe((assessments) => {
        this.assessmentsResponse = assessments;
        this.totalRecords = assessments.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = assessments.pageSize;
        this.isLoader = false;
      });
  }
  getAllCitiesByUserId() {
    this.analystService
      .getAllCitiesByUserId(this.userService?.userInfo?.userID)
      .subscribe({
        next: (res) => {
          this.cities = res.result;
          if (this.cities) {
            //this.selectedcityID = this.cities?.length > 0 ? this.cities[0].cityID : null
          } else {
            this.toaster.showWarning("No city assigned");
          }
        },
      });
  }
  GetEvaluatorByAnalyst() {
    let payload: GetAssignUserDto = {
      userID: this.userService.userInfo.userID,
    };
    this.analystService.GetEvaluatorByAnalyst(payload).subscribe({
      next: (res) => {
        this.evaluators = res.result;
      },
    });
  }
  sendMailForEditAssessment(userCityMappingID: number, mailToUserID: number) {
    let payload: SendRequestMailToUpdateCity = {
      userID: this.userService.userInfo.userID,
      userCityMappingID: userCityMappingID,
      mailToUserID: mailToUserID,
    };
    this.analystService.sendMailForEditAssessment(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.toaster.showSuccess(res.messages.join(", "));
          this.getAssessments(this.currentPage);
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to provide access");
      },
    });
  }

  selectChangedAssessment(assessmentPhase: AssessmentPhase,assessmentID: number){
    this.changeAssessment  =  {
      userID: this.userService.userInfo.userID,
      assessmentPhase: assessmentPhase,
      assessmentID: assessmentID,
    } as ChangeAssessmentStatusRequestDto;
  }
  changeAssessmentStatus() {
    if(this.changeAssessment == null) {
      this.toaster.showError("please select assessment");
    }

    this.analystService.changeAssessmentStatus(this.changeAssessment).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getAssessments(this.currentPage);
          this.toaster.showSuccess(res.messages.join(", "));
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to changed access");
      },
    });
  }

  selectAssessement(selectedAssessment : GetAssessmentResponse){
    this.selectedAssessment = selectedAssessment;
  }
  transferAssessment() {
    if(this.selectedAssessment ==null){
      this.toaster.showError("Plese select assessment");
    }
    let payload: TransferAssessmentRequestDto = {
      transferToUserID: this.userService.userInfo.userID,
      assessmentID: this.selectedAssessment.assessmentID,
    };
    this.analystService.transferAssessment(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.toaster.showSuccess(res.messages.join(", "));
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to transfer assessment");
      },
    });
  }
}
