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
import { PublicUserResponse } from "src/app/core/models/UserInfo";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { AdminService } from "../../admin.service";
import { AssessmentPhase } from "src/app/core/enums/AssessmentPhase";
import { CommonService } from "src/app/core/services/common.service";
import { AITransferAssessmentRequestDto } from "src/app/core/models/aiVm/AITransferAssessmentRequestDto";
import { finalize } from "rxjs";
import { AiComputationService } from "src/app/core/services/ai-computation.service";
declare var bootstrap: any;
@Component({
  selector: "app-assesment",
  templateUrl: "./assesment.component.html",
  styleUrl: "./assesment.component.css",
})
export class AssesmentComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  isLoader: boolean = false;
  isOpendialog = false;
  selectedcityID: number | any = "";
  selectedRoleID: UserRoleValue | any = "";
  selectedAssessment: GetAssessmentResponse | any = "";
  changeAssessment: ChangeAssessmentStatusRequestDto | any = "";
  assessmentsResponse: PaginationResponse<GetAssessmentResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  cities: CityVM[] | null = [];
  loading: boolean = false;
  evaluators: PublicUserResponse[] | null = [];
  userofSelecteCityResponse: GetAssessmentResponse[] = [];
  isAItransfer:boolean=false;
  rolesList = [
    { name: "Analyst", role: UserRoleValue.Analyst },
    { name: "Evaluator", role: UserRoleValue.Evaluator },
  ];

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private toaster: ToasterService,
    private router: Router,
    private route: ActivatedRoute,
    public commonService: CommonService,
    private aiComputationService: AiComputationService
  ) {}

  ngOnInit(): void {
    this.getAllCitiesByUserId();
    this.route.paramMap.subscribe((params) => {
      let rid = params.get("roleID");
      let cid = params.get("cityID");
      if (rid && cid) {
        this.selectedRoleID = rid;
        this.selectedcityID = cid;
      }
    });
    this.getAssessments();
  }

  goToAssessment(assessment: GetAssessmentResponse) {
    this.router.navigate([
      "/admin/assessment-result",
      assessment.assessmentID,
      assessment.userName,
    ]);
  }

  ngOnDestroy(): void {}

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
      role: this.selectedRoleID,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
    };
    this.adminService.getAssessmentResults(payload).subscribe((assessments) => {
      this.assessmentsResponse = assessments;
      this.totalRecords = assessments.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = assessments.pageSize;
      this.isLoader = false;
    });
  }
  getAllCitiesByUserId() {
    this.adminService
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

    this.adminService.changeAssessmentStatus(this.changeAssessment).subscribe({
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
  selectAssessement(selectedAssessment: GetAssessmentResponse) {
    this.selectedAssessment = selectedAssessment;
    this.getUsersAssignedToCity();
    this.opendialog();
  }
  transferAssessment(payload:TransferAssessmentRequestDto) {
    this.loading =true;
    if (this.selectedAssessment == null) {
      this.toaster.showError("Plese select assessment");
    }
    this.adminService.transferAssessment(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getAssessments(this.currentPage);
          this.toaster.showSuccess(res.messages.join(", "));
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError("Failed to transfer assessment");
      },
    });
  }

  opendialog() {
    this.isOpendialog = true;
    setTimeout(() => {
      const modalEl = document.getElementById("exampleModal");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show(); // ✅ use show()
      }
    }, 100);
  }
  closeModal() {
    this.loading = false;
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    this.isOpendialog = false;
  }
  getUsersAssignedToCity() {
    if (this.selectedAssessment == null) {
      this.toaster.showError("Plese select assessment");
    }
    this.adminService
      .getUsersAssignedToCity(this.selectedAssessment.cityID)
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.userofSelecteCityResponse = res.result ?? [];
          } else {
            this.toaster.showError(res.errors.join(", "));
          }
        },
        error: () => {
          this.toaster.showError("Failed to changed access");
        },
      });
  }


  selectAIAssessement(selectedAssessment: GetAssessmentResponse) {
    this.selectedAssessment = selectedAssessment;
  }

    aiResultTransfer() {
  
  
      if (!this.selectedAssessment) {
        this.toaster.showWarning("Please select a city");
        return;
      }
  
      const payload: AITransferAssessmentRequestDto = {
        cityID: this.selectedAssessment.cityID,
        transferToUserID: this.selectedAssessment.userID
      };
  
      this.isAItransfer = true;
      this.isLoader = true;
  
      this.aiComputationService.aiResultTransfer(payload)
      .pipe(finalize(() => {
        this.isLoader = false
        this.isAItransfer = false
      }))
      .subscribe({
        next: (res) => {
          if (res?.succeeded) {
            this.getAssessments(this.currentPage);
            this.toaster.showSuccess(res.messages?.join(", ") || "Transfer successful");
          } else {
            this.toaster.showError(res.errors?.join(", ") || "Transfer failed");
          }
        },
        error: () => {
          this.toaster.showError("Failed to transfer assessment. Please try again.");
        }
      });
    }
  
}
