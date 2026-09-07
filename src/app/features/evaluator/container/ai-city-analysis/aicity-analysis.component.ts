import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CityVM } from 'src/app/core/models/CityVM';
import { NgSelectModule } from '@ng-select/ng-select';
import { environment } from 'src/environments/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { UserService } from 'src/app/core/services/user.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AiCitySummeryDto } from 'src/app/core/models/aiVm/AiCitySummeryDto';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
import { AiCitySummeryRequestDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestDto';
import { TypingTextComponent } from 'src/app/shared/standAlone/typing-text/typing-text.component';
import { ViewCityDetailComponent } from '../../../../shared/standAlone/view-city-detail/view-city-detail.component';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { EvaluatorService } from '../../evaluator.service';
import { AddCommentComponent } from '../../features/add-comment/add-comment.component';
import { AiCitySummeryRequestPdfDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestPdfDto';


declare var bootstrap: any; // 👈 use Bootstrap JS API
@Component({
  selector: 'app-aicity-analysis',
  standalone: true,
  imports: [TypingTextComponent, CommonModule,
    ViewCityDetailComponent, CircularScoreComponent, SparklineScoreComponent,
    PaginationComponent, FormsModule, NgSelectModule, AddCommentComponent,
    MatTooltipModule],
  templateUrl: './aicity-analysis.component.html',
  styleUrl: './aicity-analysis.component.css'
})
export class AICityAnalaysisComponent implements OnInit, OnDestroy {
    selectedYear = new Date().getFullYear();
  urlBase = environment.apiUrl;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  isLoader: boolean = false;
  aiCities: AiCitySummeryDto[] = []
  selectedCity?: AiCitySummeryDto | null = null;
  cities: CityVM[] | null = [];
  filterCity!: number;
  selectedIndex: number = -1;
  loading: boolean = false;
  constructor(private aiComputationService: AiComputationService, private evaluatorService: EvaluatorService,
    private toaster: ToasterService, private userService: UserService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAiAccessCity();
    this.getAiCities();
  }
  ngOnDestroy(): void {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
  getAiAccessCity() {
    this.evaluatorService.getAiAccessCity(this.userService.userInfo.userID ?? 0).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.cities = res.result;
        }
        else {
          this.toaster.showError(res.errors.join(', '));
        }
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError('There is an error occure please try again')
      }
    });
  }

  getAiCities(currentPage: any = 1) {
    this.isLoader = true;
    let payload: AiCitySummeryRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: 'AIScore',
      pageNumber: currentPage,
      pageSize: this.pageSize
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
        this.toaster.showError("There is an Error Please Try later")
      }
    })
  }
  viewDetails(city: AiCitySummeryDto) {
    this.selectedCity = city;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    // Clear selection when sidebar closes
    sidebarEl?.addEventListener('hidden.bs.offcanvas', () => {
      this.selectedCity = null;
      this.cdr.detectChanges();
    }, { once: true });

    offcanvas.show();
  }

  opendialog(city: AiCitySummeryDto) {
    this.selectedCity = city;
    const modalEl = document.getElementById("RegenerateAIScoreModal");
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show(); // ✅ use show()
    }
  }

  closeModal() {
    const modalEl = document.getElementById("RegenerateAIScoreModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  addComment(payload: any) {
    this.loading = true;
    this.aiComputationService.addComment(payload).subscribe({
      next: (res) => {
        this.closeModal();
        this.loading = false;
        if (res.succeeded) {
          this.toaster.showSuccess(res.messages.join(', '));
        }
        else {
          this.toaster.showError(res.errors.join(', '));
        }
        this.closeModal();
      },
      error: () => {
        this.closeModal();
        this.loading = false;
        this.toaster.showError('There is an error occure please try again')
      }
    });
  }

}
