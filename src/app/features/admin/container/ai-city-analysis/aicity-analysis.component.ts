import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CityVM } from 'src/app/core/models/CityVM';
import { NgSelectModule } from '@ng-select/ng-select';
import { environment } from 'src/environments/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { UserService } from 'src/app/core/services/user.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { PromptComponent } from 'src/app/shared/prompt/prompt.component';
import { AiCitySummeryDto } from 'src/app/core/models/aiVm/AiCitySummeryDto';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
import { AiCitySummeryRequestDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestDto';
import { TypingTextComponent } from 'src/app/shared/standAlone/typing-text/typing-text.component';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { ChangedAiCityEvaluationStatusDto } from 'src/app/core/models/aiVm/ChangedAiCityEvaluationStatusDto';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { ViewCityDetailComponent } from '../../../../shared/standAlone/view-city-detail/view-city-detail.component';
import { RegenerateAiScoreAndAddViewerComponent } from 'src/app/shared/standAlone/regenerate-ai-score-and-add-viewer/regenerate-ai-score-and-add-viewer.component';
import { GetAssignUserDto, PublicUserResponse } from 'src/app/core/models/UserInfo';
import { RegenerateAiSearchDto } from 'src/app/core/models/aiVm/RegenerateAiSearchDto';
import { AdminService } from '../../admin.service';
import { UtcToLocalTooltipDirective } from 'src/app/shared/directives/utc-to-local-tooltip.directive';
import { AiCitySummeryRequestPdfDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestPdfDto';
import { ActivatedRoute } from '@angular/router';
import { DocumentFormat } from 'src/app/core/enums/DocumentFormat';
declare var bootstrap: any; // 👈 use Bootstrap JS API

@Component({
  selector: "app-aicity-analysis",
  standalone: true,
  imports: [TypingTextComponent, CommonModule,
    ViewCityDetailComponent, CircularScoreComponent, SparklineScoreComponent,
    PaginationComponent, FormsModule, NgSelectModule, PromptComponent, RegenerateAiScoreAndAddViewerComponent,
    MatTooltipModule, UtcToLocalTooltipDirective],
  templateUrl: './aicity-analysis.component.html',
  styleUrl: './aicity-analysis.component.css'
})
export class AICityAnalaysisComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  urlBase = environment.apiUrl;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  isLoader: boolean = false;
  loading: boolean = false;
  aiCities: AiCitySummeryDto[] = [];
  selectedCity?: AiCitySummeryDto | null = null;
  cities: CityVM[] | null = [];
  filterCity!: number;
  selectedIndex: number = -1;
  selectedChangedStatusIndex: number = -1;
  evaluatorList: PublicUserResponse[] = [];
  isOpenResearchBox: boolean = false;
  isExporting: boolean = false;
  isRecalcualteKpi:boolean =false;
  showRegenerateMissingQuestionsOption:boolean = false;
  constructor(private aiComputationService: AiComputationService, private adminService: AdminService,
    private toaster: ToasterService, private userService: UserService, private cdr: ChangeDetectorRef,
    public commonService: CommonService, private route: ActivatedRoute,) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params["cityID"]) {
        this.filterCity = +params["cityID"];
      }
    });
    this.getCityUserCities();
    this.getAiCities();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
  yearChanged() {
    this.getAiCities();
  }
  getCityUserCities() {
    this.adminService
      .getAllCitiesByUserId(this.userService.userInfo.userID ?? 0)
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.cities = res.result;
          } else {
            this.toaster.showError(res.errors.join(", "));
          }
        },
        error: () => {
          this.isLoader = false;
          this.toaster.showError("There is an error occure please try again");
        },
      });
  }

  getAiCities(currentPage: any = 1) {
    this.isLoader = true;
    let payload: AiCitySummeryRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "AIScore",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      year: this.selectedYear
    }
    if (this.userService?.userInfo?.userID == null || this.filterCity > 0) {
      payload.cityID = this.filterCity;
    }
    this.aiCities = [];
    this.aiComputationService.getAICities(payload).subscribe({
      next: (res) => {
        this.aiCities = res.data;
        this.totalRecords = res.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = res.pageSize;
        this.isLoader = false;
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("There is an Error Please Try later");
      },
    });
  }

  viewDetails(city: AiCitySummeryDto) {
    this.selectedCity = city;
    const sidebarEl = document.getElementById("kpiLayerSidebar");
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    // Clear selection when sidebar closes
    sidebarEl?.addEventListener(
      "hidden.bs.offcanvas",
      () => {
        this.selectedCity = null;
        this.cdr.detectChanges();
      },
      { once: true }
    );

    offcanvas.show();
  }


  aiCityDetailsReport(city: AiCitySummeryDto, selectedIndex: number, format: string,mode: 'ai' | 'manual') {
    this.selectedIndex = selectedIndex;
    if (this.selectedIndex == -1) return;

    let payload: AiCitySummeryRequestPdfDto = {
      cityID: city.cityID,
      year: this.selectedYear,
      format: format,
      reportType : mode
    };

    this.aiComputationService.aiCityDetailsReport(payload).subscribe({
      next: (blob) => {
        this.selectedIndex = -1;

        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");

          const ext = format == DocumentFormat.Pdf ? 'pdf' : 'docx';

          link.href = url;
          link.download = `${city.cityName}_Details_${new Date().toISOString().split("T")[0]}.${ext}`;

          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.toaster.showSuccess("Report generated successfully");
        }
      },
      error: () => {
        this.selectedIndex = -1;
        this.toaster.showError("There is an error occurred please try again");
      }
    });
  }

  selectCityToChangedStatus(city: AiCitySummeryDto, selectedIndex: number) {
    this.selectedChangedStatusIndex = selectedIndex;
    this.selectedCity = city;
  }

  changeAiStatus() {
    if (this.selectedCity) {
      let paylod: ChangedAiCityEvaluationStatusDto = {
        cityID: this.selectedCity.cityID,
        isVerified: !this.selectedCity.isVerified,
      };
      this.aiComputationService
        .changedAiCityEvaluationStatus(paylod)
        .subscribe({
          next: (res) => {
            this.selectedChangedStatusIndex = -1;
            if (res.succeeded) {
              this.getAiCities();
              this.toaster.showSuccess(res.messages.join(", "));
            } else {
              this.toaster.showError(res.errors.join(", "));
            }
          },
          error: () => {
            this.toaster.showError("There is an error occure please try again");
            this.selectedChangedStatusIndex = -1;
          },
        });
    } else {
      this.toaster.showWarning("Please try again");
    }
  }

  cancelChangeAiStatus() {
    this.selectedChangedStatusIndex = -1;
  }

  opendialog(city: AiCitySummeryDto) {
    this.isOpenResearchBox = true;
    this.showRegenerateMissingQuestionsOption =
  (city.aiCompletionRate ?? 0) > 0 &&
  (city.aiCompletionRate ?? 0) < 100;
    if (!this.evaluatorList.length) {
      //this.getUsersAssignedToCity();
    }
    this.selectedCity = city;
    setTimeout(() => {
      const modalEl = document.getElementById("RegenerateAIScoreModal");
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
    const modalEl = document.getElementById("RegenerateAIScoreModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    this.isOpenResearchBox = false;
  }
  getUsersAssignedToCity() {
    let payload: GetAssignUserDto = {
      userID: this.userService.userInfo.userID,
    };
    this.adminService.GetEvaluatorByAnalyst(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.evaluatorList = res.result ?? [];
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to changed access");
      },
    });
  }
  regenerateAiSearch(payload: RegenerateAiSearchDto) {
    if (this.selectedCity) {
      this.loading = true;

      this.aiComputationService.regenerateAiSearch(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.getAiCities();
          this.selectedChangedStatusIndex = -1;
          if (res.succeeded) {
            this.toaster.showSuccess(res.messages.join(", "));
          } else {
            this.toaster.showError(res.errors.join(", "));
          }
          this.closeModal();
        },
        error: () => {
          this.loading = false;
          this.toaster.showError("There is an error occure please try again");
          this.selectedChangedStatusIndex = -1;
          this.closeModal();
        },
      });
    } else {
      this.toaster.showWarning("Please try again");
      this.closeModal();
    }
  }
  reCalculateKpis() {
    this.isRecalcualteKpi =true;

      this.aiComputationService.reCalculateKpis().subscribe({
        next: (res) => {
          this.isRecalcualteKpi =false;
          if (res.succeeded) {
            this.toaster.showSuccess(res.messages.join(", "));
          } else {
            this.toaster.showError(res.errors.join(", "));
          }
          this.closeModal();
        },
        error: () => {
          this.isRecalcualteKpi =false;
          this.toaster.showError("There is an error occure please try again");
          this.closeModal();
        },
      });
    
  }
  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.cityName?.toLowerCase().includes(term) ||
      item.cityAliasName?.toLowerCase().includes(term)
    );
  }
}
