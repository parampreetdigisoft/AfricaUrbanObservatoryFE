import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CityVM } from 'src/app/core/models/CityVM';
import { NgSelectModule } from '@ng-select/ng-select';
import { AnalystService } from '../../analyst.service';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { UserService } from 'src/app/core/services/user.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AITrustLevelVM } from 'src/app/core/models/aiVm/AITrustLevelVM';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
import { AiPillarQuetionsRequestDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestDto';
import { TypingTextComponent } from 'src/app/shared/standAlone/typing-text/typing-text.component';
import { AIEstimatedQuestionScoreDto } from 'src/app/core/models/aiVm/AIEstimatedQuestionScoreDto';
import { ChangeDetectorRef, Component, inject, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { ViewAiQuestionDetailsComponent } from '../../../../shared/standAlone/view-ai-question-details/view-ai-question-details.component';
import { UtcToLocalTooltipDirective } from 'src/app/shared/directives/utc-to-local-tooltip.directive';
declare var bootstrap: any; // 👈 use Bootstrap JS API

@Component({
  selector: 'app-ai-question-analysis',
  standalone: true,
  imports: [TypingTextComponent, CommonModule,
    ViewAiQuestionDetailsComponent, CircularScoreComponent, SparklineScoreComponent,
    PaginationComponent, FormsModule, NgSelectModule,
    MatTooltipModule, UtcToLocalTooltipDirective],
  templateUrl: './ai-question-analysis.component.html',
  styleUrl: './ai-question-analysis.component.css'
})
export class AiQuestionAnalysisComponent implements OnInit, OnChanges {
  selectedYear = new Date().getFullYear();
  selectedCityID!: number;
  selectedPillarID!: number;
  selectedQuestion: AIEstimatedQuestionScoreDto | null = null;
  isLoader: boolean = false;
  cities: CityVM[] = [];
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  aiQuestions: AIEstimatedQuestionScoreDto[] = [];
  pillars: PillarsVM[] = [];
  aiTrustLevels: AITrustLevelVM[] = [];
  analystService = inject(AnalystService);
  userService = inject(UserService);
  headerTextValue: string | null = null;
  headerTextRepeatation: boolean = false;
  constructor(private route: ActivatedRoute, private toaster: ToasterService, private aiComputationService: AiComputationService, private cdr: ChangeDetectorRef, public commonService: CommonService) { }

  ngOnChanges(changes: SimpleChanges): void {
    //throw new Error('Method not implemented.');
  }

  updateHeaderText() {
    this.headerTextValue = null;
    this.headerTextRepeatation = false;

    const p = this.pillars.find(x => x.pillarID === this.selectedPillarID)?.pillarName ?? '';
    const c = this.cities.find(x => x.cityID === this.selectedCityID)?.cityName ?? '';

    setTimeout(() => {
      this.headerTextRepeatation = true;

      const truncatedPillar =
        p.length > 27 ? `${p.substring(0, 20)}...` : p;

      this.headerTextValue =
        c && p
          ? `${c} > ${truncatedPillar} Analysis`
          : '';

    }, 500);
  }

  ngOnInit(): void {
    this.isLoader = true;
    this.loadInitialData();
    this.getAITrustLevels();
    this.route.queryParams.subscribe(params => {
      let cid = +params['cityID'] || null;
      let pid = +params['pillarID'] || null;
      let sYear = +params['year'] || this.selectedYear;
      if (pid && cid) {
        this.selectedCityID = Number(cid);
        this.selectedPillarID = Number(pid);
        this.selectedYear = Number(sYear);
        this.getAIPillarQuestions();
      }
    });
  }

  getAITrustLevels() {
    this.aiComputationService.getAITrustLevels().subscribe((p) => {
      this.aiTrustLevels = p.result || [];
    });
  }


  loadInitialData() {
    this.isLoader = true;

    forkJoin({
      pillarsRes: this.analystService.getAllPillars(),
      citiesRes: this.analystService.getAllCitiesByUserId(this.userService.userInfo?.userID ?? 0)
    }).subscribe({
      next: ({ pillarsRes, citiesRes }) => {

        this.pillars = pillarsRes ?? [];
        if (citiesRes.succeeded) {
          this.cities = citiesRes.result ?? [];
        } else {
          this.toaster.showError(citiesRes.errors.join(', '));
        }

        if ((!this.selectedPillarID && !this.selectedCityID) && this.pillars.length && this.cities.length) {
          this.selectedPillarID = this.pillars[0].pillarID
          this.selectedCityID = this.cities[0].cityID
          this.getAIPillarQuestions()
        }
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError('There is an error occurred, please try again');
      }
    });
  }

  getAIPillarQuestions(currentPage: any = 1) {
    this.isLoader = true;
    let payload: AiPillarQuetionsRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: 'AIScore',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      year: this.selectedYear
    }
    if (this.selectedCityID > 0) {
      payload.cityID = this.selectedCityID;
    }
    if (this.selectedPillarID > 0) {
      payload.pillarID = this.selectedPillarID;
    }

    this.aiComputationService.getAIPillarQuestions(payload).subscribe({
      next: (res) => {
        this.updateHeaderText();
        this.isLoader = false;
        this.aiQuestions = res.data;
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

  viewDetails(city: AIEstimatedQuestionScoreDto) {
    this.selectedQuestion = city;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);

    // Clear selection when sidebar closes
    sidebarEl?.addEventListener('hidden.bs.offcanvas', () => {
      this.selectedQuestion = null;
      this.cdr.detectChanges();
    }, { once: true });

    offcanvas.show();
  }
}
