import { CommonModule } from '@angular/common';
declare var bootstrap: any; // 👈 use Bootstrap JS API
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexPlotOptions,
  ApexLegend,
  ApexFill,
  ApexStates,
  ChartComponent,
  ApexDataLabels,
  ApexStroke
} from 'ng-apexcharts';
import { CityVM } from 'src/app/core/models/CityVM';
import { AnalystService } from '../../analyst.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { SharedModule } from 'src/app/shared/share.module';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/core/services/user.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AITrustLevelVM } from 'src/app/core/models/aiVm/AITrustLevelVM';
import { ChartTableRowDto } from 'src/app/core/models/CompareCityResponseDto';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { ChangeDetectorRef, Component, OnChanges, OnInit, ViewChild } from '@angular/core';
import { RegeneratePilalrAiSearchDto } from 'src/app/core/models/aiVm/RegenerateAiSearchDto';
import { AiCityPillarResponseDto, AiCityPillarVM } from 'src/app/core/models/aiVm/AiCityPillarResponseDto';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { ViewAiPillarDetailsComponent } from '../../../../shared/standAlone/view-ai-pillar-details/view-ai-pillar-details.component';
import { RegenerateAiScoreAndAddViewerComponent } from 'src/app/shared/standAlone/regenerate-ai-score-and-add-viewer/regenerate-ai-score-and-add-viewer.component';
import { UtcToLocalTooltipDirective } from 'src/app/shared/directives/utc-to-local-tooltip.directive';
import { AiCitySummeryRequestPdfDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestPdfDto';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string[];
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  fill: ApexFill;
  states: ApexStates;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-kpianalysis',
  standalone: true,
  imports: [CommonModule, SharedModule, CircularScoreComponent, SparklineScoreComponent, ViewAiPillarDetailsComponent, RegenerateAiScoreAndAddViewerComponent, UtcToLocalTooltipDirective],
  templateUrl: './kpianalysis.component.html',
  styleUrl: './kpianalysis.component.css'
})
export class KPIAnalysisComponent implements OnInit {
  urlBase = environment.apiUrl;
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  pillers: PillarsVM[] = [];
  selectedCity?: number;
  cities: CityVM[] | null = [];
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> = {};
  aiCityPillarResponseDto: AiCityPillarResponseDto | null = null;
  selectedAiCityPillar: AiCityPillarVM | null = null;
  isLoader: boolean = false;
  chartTableData: ChartTableRowDto[] = [];
  selectedIndex: number = -1;
  aiTrustLevels: AITrustLevelVM[] = [];
  loading: boolean = false;
  isOpenResearchBox: boolean = false;
  selectedChangedStatusIndex: number = -1;
  showRegenerateMissingQuestionsOption = false;
  constructor(
    private analystService: AnalystService,
    private toaster: ToasterService,
    private userService: UserService,
    private aiComputationService: AiComputationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.route.queryParams.subscribe(params => {
      let cid = +params['cityID'] || null;
      let sYear = +params['year'] || this.selectedYear;
      if (cid) {
        this.selectedCity = Number(cid);
        this.selectedYear = Number(sYear);
      }
    });
    this.getCityUserCities();
    this.getAITrustLevels();
  }
  getAITrustLevels() {
    this.aiComputationService.getAITrustLevels().subscribe((p) => {
      this.aiTrustLevels = p.result || [];
    });
  }
  getSelectedCity() {
    return this.cities?.find(x => x.cityID == this.selectedCity);
  }

  getCityUserCities() {
    this.analystService.getAllCitiesByUserId(this.userService.userInfo?.userID ?? 0).subscribe({
      next: (p) => {

        this.cities = p.result || [];
        if (this.cities?.length && !this.selectedCity) {
          this.selectedCity = this.cities[0].cityID;
        }
        this.getAICityPillars();
      },
      error: () => {
        this.toaster.showError("There is an error please Try again");
        this.getAICityPillars();
      }
    });
  }

  getAICityPillars() {
    if (!this.selectedCity) {
      this.toaster.showWarning("Please select at least one city to view data.");
      return;
    }
    this.isLoader = true;
    let payload: AiCitySummeryRequestPdfDto = {
      cityID: this.selectedCity,
      year: this.selectedYear,
      format:"pdf"
    }
    this.aiComputationService.getAICityPillars(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded && res.result != null) {
          this.aiCityPillarResponseDto = res.result;

          this.buildPillarComparisonChart();
        }
        else {
          this.toaster.showInfo("No comparison data available for the selected cities.");
        }
      },
      error: (err) => {
        this.isLoader = false;
        this.toaster.showError("Failed to load comparison data.");
      }
    });
  }

  buildPillarComparisonChart() {
    // 🔹 Stable fake score generator for locked pillars (15–35)
    const getLockedScore = (pillarId: number) => {
      return 15 + (pillarId * 7) % 20;
    };

    // 1️⃣ Reorder: accessible first, locked last
    const data = [...(this.aiCityPillarResponseDto?.pillars ?? [])].sort(
      (a, b) => Number(b.isAccess) - Number(a.isAccess)
    );

    // 2️⃣ Generate categories (pillar names)
    const categories = this.buildUniqueCategories(data);

    // 3️⃣ Series (real data for access, placeholder for locked)
    const aiSeries = data.map(x =>
      x.isAccess ? (x.aiProgress ?? 0) : getLockedScore(x.pillarID)
    );

    const evaluatorSeries = data.map(x =>
      x.isAccess ? (x.evaluatorProgress ?? 0) : getLockedScore(x.pillarID)
    );

    const discrepancySeries = data.map(x =>
      x.isAccess ? (x.discrepancy ?? 0) : getLockedScore(x.pillarID)
    );

    let colors = [
      "#8eb5ab",
      "#578679",
      "#2f4841",
    ]

    this.chartOptions = {
      series: [
        { name: 'AI Progress', data: aiSeries },
        { name: 'Evaluator Progress', data: evaluatorSeries },
        { name: 'Discrepancy', data: discrepancySeries }
      ],

      chart: {
        type: 'bar',
        height: 420,
        toolbar: { show: false },
        zoom: {
          enabled: false
        },
        animations: {
          enabled: true,
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },

      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 8,
          borderRadiusApplication: "end",
          distributed: false,
          dataLabels: {
            position: 'top' // Force labels to top of bars
          }
        }
      },

      dataLabels: {
        enabled: true,
        formatter: (val: number, opts) => {
          const pillar = data[opts.dataPointIndex];

          // 🔒 Hide label for locked pillars
          if (!pillar.isAccess) {
            return '';
          }

          return `${Math.round(val)}`;
        },
        offsetY: -10, // Position above bar
        style: {
          fontSize: '10px',
          fontWeight: 200,
          colors: ['#faf8d1ff']
        },
        background: {
          enabled: true,
          foreColor: '#0906aaff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 0,
          opacity: 0.9
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          rotate: -45,
          rotateAlways: false,
          style: {
            fontSize: '11px'
          }
        }
      },

      yaxis: {
        title: { text: 'Score' },
        min: 0,
        max: 100, // Add padding at top so 100% labels don't get cut off
        tickAmount: 5,
        labels: {
          formatter: (val) => {
            // Only show positive values
            return val >= 0 ? `${Math.round(val)}` : '';
          }
        }
      },

      // 🎨 Disabled color for locked pillars
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: [
          "#78C2CC", // AI lighter
          "#5A5F66", // Evaluator lighter
          "#F07A67", // Discrepancy lighter
        ],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      colors: colors,

      states: {
        hover: {
          filter: { type: 'none' }
        },
        active: {
          filter: { type: 'none' }
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: ({ dataPointIndex }) => {
          const pillar = data[dataPointIndex];

          // 🔒 Locked pillar tooltip
          if (!pillar.isAccess) {
            return `
            <div style="padding:10px; font-size:13px; color:#666; background: white; border: 1px solid #ddd; border-radius: 4px;">
              <strong>${pillar.pillarName}</strong><br/>
              🔒 Upgrade your plan to unlock real insights<br/>
              
            </div>
          `;
          }

          // ✅ Accessible pillar tooltip
          return `
            <div style="
              padding:12px 14px;
              min-width:220px;
              background:#ffffff;
              border-radius:8px;
              box-shadow:0 8px 24px rgba(0,0,0,0.12);
              border:1px solid #e6e6e6;
              font-family: Inter, system-ui, -apple-system, sans-serif;
              font-size:13px;
              transition: all .2s ease;
            ">

              <!-- Header -->
              <div style="
                font-weight:600;
                font-size:14px;
                color:#1f2937;
                margin-bottom:8px;
              ">
                ${pillar.pillarName}
              </div>

              <!-- Metrics -->
              <div style="display:grid; row-gap:6px;">

                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#6b7280;">AI Progress</span>
                  <span style="font-weight:600; color:#2d5e56;">
                    ${pillar.aiProgress?.toFixed(2) ?? '0.00'}
                  </span>
                </div>

                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#6b7280;">Evaluator</span>
                  <span style="font-weight:600; color:#39539E;">
                    ${pillar.evaluatorProgress?.toFixed(2) ?? '0.00'}
                  </span>
                </div>

                <div style="
                  display:flex;
                  justify-content:space-between;
                  padding-top:6px;
                  margin-top:6px;
                  border-top:1px dashed #e5e7eb;
                ">
                  <span style="color:#6b7280;">Discrepancy</span>
                  <span style="
                    font-weight:600;
                    color:${(pillar.discrepancy ?? 0) > 0 ? '#b45309' : '#059669'};
                  ">
                    ${pillar.discrepancy?.toFixed(2) ?? '0.00'}
                  </span>
                </div>

              </div>
            </div>
          `;
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        offsetY: 0
      }
    };
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  viewDetails(pillar: AiCityPillarVM) {
    this.selectedAiCityPillar = pillar;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);

    // Clear selection when sidebar closes
    sidebarEl?.addEventListener('hidden.bs.offcanvas', () => {
      this.selectedAiCityPillar = null;
      this.cdr.detectChanges();
    }, { once: true });

    offcanvas.show();
  }

  viewQuestions(pillar: AiCityPillarVM) {
    this.router.navigate(['/analyst/ai/questions-analysis'], {
      queryParams: {
        cityID: this.selectedCity,
        pillarID: pillar.pillarID,
        year: this.selectedYear
      }
    });
  }


  buildUniqueCategories(data: { pillarName: string }[]): string[] {
    const used = new Set<string>();
    return data.map(item => {
      if (!item.pillarName) return '';

      const words = item.pillarName.trim().split(/\s+/);
      let label = '';

      for (let i = 1; i <= words.length; i++) {
        const candidate =
          i < words.length
            ? words.slice(0, i).join(' ')
            : words.join(' ');

        if (!used.has(candidate)) {
          label = candidate + (i < words.length ? '...' : '');
          used.add(candidate);
          break;
        }
      }

      // absolute fallback (should not happen)
      if (!label) {
        label = words[0] + '...';
      }

      return label;
    });
  }
  opendialog(pillar: AiCityPillarVM) {
    this.isOpenResearchBox = true;
    this.showRegenerateMissingQuestionsOption =
  (pillar.aiCompletionRate ?? 0) > 0 &&
  (pillar.aiCompletionRate ?? 0) < 100;
    this.selectedAiCityPillar = pillar;
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

  regenerateAiSearch(payload: RegeneratePilalrAiSearchDto) {
    if (this.selectedAiCityPillar) {
      this.loading = true;
      payload.pillarID = this.selectedAiCityPillar.pillarID;

      this.aiComputationService.regenerateSinglePillarAiSearch(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.getAICityPillars();
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
          this.toaster.showError('There is an error occure please try again');
          this.selectedChangedStatusIndex = -1;
          this.closeModal();
        }
      });
    } else {
      this.toaster.showWarning('Please try again');
      this.closeModal();
    }
  }
}
