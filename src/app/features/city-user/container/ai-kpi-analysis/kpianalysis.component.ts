import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnChanges, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/shared/share.module';
import { ChartTableRowDto, CompareCityResponseDto } from "src/app/core/models/CompareCityResponseDto";
import { environment } from "src/environments/environment";
import { CityVM } from 'src/app/core/models/CityVM';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CityUserService } from 'src/app/features/city-user/city-user.service';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { AiCityPillarResponseDto, AiCityPillarVM } from 'src/app/core/models/aiVm/AiCityPillarResponseDto';
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
  ApexDataLabels
} from 'ng-apexcharts';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AITrustLevelVM } from 'src/app/core/models/aiVm/AITrustLevelVM';
import { ViewAiPillarDetailsComponent } from '../../features/view-ai-pillar-details/view-ai-pillar-details.component';
import { AiCitySummeryRequestPdfDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestPdfDto';
import { CommonService } from 'src/app/core/services/common.service';
import { DocumentFormat } from 'src/app/core/enums/DocumentFormat';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string[];
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  fill: any;
  states: ApexStates;
  dataLabels: ApexDataLabels;
  stroke: any;
  markers: any;
  grid: any;
};

@Component({
  selector: 'app-kpianalysis',
  standalone: true,
  imports: [CommonModule, SharedModule, CircularScoreComponent, SparklineScoreComponent, ViewAiPillarDetailsComponent],
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

  constructor(
    private cityUserService: CityUserService,
    private toaster: ToasterService,
    private aiComputationService: AiComputationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public commonService: CommonService
  ) {

  }

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

  getCityUserCities() {
    this.cityUserService.getCityUserCities().subscribe({
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
    this.cityUserService.getAICityPillars(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded && res.result != null) {
          this.aiCityPillarResponseDto = res.result;

          this.buildPillarComparisonChart();
        }
        else {
          this.toaster.showInfo("No comparison data available for the selected cities.");
          this.aiCityPillarResponseDto=null;
          this.buildPillarComparisonChart();
        }
      },
      error: (err) => {
        this.isLoader = false;
        this.toaster.showError("Failed to load comparison data.");
      }
    });
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
    this.router.navigate(['/cityuser/ai/questions-analysis'], {
      queryParams: {
        cityID: this.selectedCity,
        pillarID: pillar.pillarID,
        year:this.selectedYear
      }
    });
  }
  aiPillarDetailsReport(city: AiCityPillarVM, selectedIndex: number, format: string) {
      if (this.selectedIndex != -1) return;
      this.selectedIndex = selectedIndex;
      let payload: AiCitySummeryRequestPdfDto = {
        cityID: city.cityID,
        year: this.selectedYear,
        pillarID: city.pillarID,
        format:format
      }
      this.aiComputationService.aiPillarDetailsReport(payload).subscribe({
        next: (blob) => {
          this.selectedIndex = -1;
          if (blob) {
            // Create download link
            const ext = format == DocumentFormat.Pdf ? 'pdf' : 'docx';          
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
  
            link.download = `${city.pillarName}_Details_${new Date().toISOString().split('T')[0]}..${ext}`;
  
            // Trigger download
            document.body.appendChild(link);
            link.click();
  
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.toaster.showSuccess('Report generated successfully')
          }
        },
        error: () => {
          this.toaster.showError('There is an error occure please try again');
          this.selectedIndex = -1;
        }
      });
    }

  buildPillarComparisonChart() {
    const getLockedScore = (pillarId: number) => {
      return 15 + (pillarId * 7) % 20;
    };

    const data = [...(this.aiCityPillarResponseDto?.pillars ?? [])].sort(
      (a, b) => Number(b.isAccess) - Number(a.isAccess)
    );

    const categories = this.buildUniqueCategories(data);
    const aiSeries = data.map(x =>
      x.isAccess ? (x.aiProgress ?? 0) : getLockedScore(x.pillarID)
    );

    this.chartOptions = {
      series: [{
        name: 'Progress',
        data: aiSeries
      }],

      chart: {
        type: 'area',
        height: 420,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },

      dataLabels: {
        enabled: true,
        formatter: (val: number, opts) => {
          const pillar = data[opts.dataPointIndex];
          if (!pillar.isAccess) return '';
          return `${Math.round(val)}`;
        },
        offsetY: -10,
        style: {
          fontSize: '11px',
          fontWeight: 700,
          colors: ['#2f4841']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          padding: 6,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#79a89b',
          opacity: 0.95
        }
      },

      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#4a7167']
      },

      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#79a89b',
              opacity: 0.8
            },
            {
              offset: 50,
              color: '#8eb5ab',
              opacity: 0.5
            },
            {
              offset: 100,
              color: '#a2c3ba',
              opacity: 0.2
            }
          ]
        }
      },

      markers: {
        size: data.map(p => p.isAccess ? 6 : 4),
        colors: data.map(p => p.isAccess ? this.PillarColorByScore(p) : '#d3d3d3'),
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 8,
          sizeOffset: 3
        }
      },

      xaxis: {
        categories: categories,
        labels: {
          rotate: -45,
          style: {
            fontSize: '11px',
            fontWeight: 500,
            colors: '#6b7280'
          }
        },
        axisBorder: {
          show: true,
          color: '#e5e7eb'
        },
        axisTicks: {
          show: true,
          color: '#e5e7eb'
        }
      },

      yaxis: {
        title: {
          text: 'Progress',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#4b5563'
          }
        },
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          formatter: (val) => val >= 0 ? `${Math.round(val)}` : '',
          style: {
            fontSize: '12px',
            colors: '#6b7280'
          }
        }
      },

      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
        xaxis: {
          lines: { show: false }
        },
        yaxis: {
          lines: { show: true }
        }
      },

      tooltip: {
        enabled: true,
        custom: ({ dataPointIndex }) => {
          const pillar = data[dataPointIndex];

          if (!pillar.isAccess) {
            return `
            <div style="
              padding: 18px 20px;
              min-width: 280px;
              background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
              border-radius: 14px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
              font-family: 'Inter', system-ui, sans-serif;
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.1);
              position: relative;
              overflow: hidden;
            ">
              <!-- Animated Background Pattern -->
              <div style="
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
                animation: pulse 3s ease-in-out infinite;
              "></div>

              <!-- Content -->
              <div style="position: relative; z-index: 1;">
                <!-- Icon & Title -->
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 16px;
                ">
                  <div style="
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                  ">
                    🔒
                  </div>
                  <div>
                    <div style="
                      font-weight: 700;
                      font-size: 16px;
                      margin-bottom: 2px;
                    ">
                      ${pillar.pillarName}
                    </div>
                    <div style="
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.6);
                      text-transform: uppercase;
                      letter-spacing: 1px;
                    ">
                      Premium Access Required
                    </div>
                  </div>
                </div>

                <!-- Divider -->
                <div style="
                  height: 1px;
                  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
                  margin: 14px 0;
                "></div>

                <!-- Features List -->
                <div style="
                  margin-bottom: 16px;
                  font-size: 13px;
                  line-height: 1.8;
                  color: rgba(255, 255, 255, 0.9);
                ">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="color: #8b5cf6; font-size: 16px;">✓</span>
                    <span>Detailed Analytics</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="color: #8b5cf6; font-size: 16px;">✓</span>
                    <span>Real-time Progress Tracking</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #8b5cf6; font-size: 16px;">✓</span>
                    <span>Advanced Insights & Reports</span>
                  </div>
                </div>

                <!-- CTA Button -->
                <button style="
                  width: 100%;
                  padding: 12px 20px;
                  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                  color: white;
                  border: none;
                  border-radius: 10px;
                  font-weight: 700;
                  font-size: 14px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">
                  🚀 Upgrade Now
                </button>
              </div>
            </div>
          `;
          }

          const progressColor = this.PillarColorByScore(pillar);
          const progressPercent = pillar.aiProgress ?? 0;
          const statusText = progressPercent >= 75 ? 'Excellent Performance' :
            progressPercent >= 50 ? 'Strong Progress' :
              progressPercent >= 25 ? 'Steady Growth' : 'Early Stage';
          const statusIcon = progressPercent >= 75 ? '🌟' :
            progressPercent >= 50 ? '📈' :
              progressPercent >= 25 ? '⚡' : '🌱';

          return `
          <div style="
            padding: 18px 20px;
            min-width: 300px;
            background: #ffffff;
            border-radius: 14px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
            border-left: 4px solid ${progressColor};
            font-family: 'Inter', system-ui, sans-serif;
            position: relative;
            overflow: hidden;
          ">
            <!-- Background Accent -->
            <div style="
              position: absolute;
              top: -30px;
              right: -30px;
              width: 120px;
              height: 120px;
              background: ${progressColor};
              opacity: 0.08;
              border-radius: 50%;
            "></div>

            <!-- Content -->
            <div style="position: relative; z-index: 1;">
              <!-- Header -->
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;
              ">
                <div>
                  <div style="
                    font-weight: 700;
                    font-size: 16px;
                    color: #111827;
                    margin-bottom: 6px;
                  ">
                    ${pillar.pillarName}
                  </div>
                  <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: ${progressColor}15;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    color: ${progressColor}; 
                  ">
                    ${statusIcon} ${statusText}
                  </div>
                </div>
                <div style="
                  font-size: 28px;
                  font-weight: 800;
                  color: ${progressColor};
                  line-height: 1;
                  margin-left:5px;
                ">
                  ${progressPercent.toFixed(0)}
                </div>
              </div>

              <!-- Progress Bar -->
              <div style="margin-bottom: 14px;">
                <div style="
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 8px;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  font-weight: 600;
                  color: #6b7280;
                ">
                  <span>Progress</span>
                  <span>${progressPercent.toFixed(1)}</span>
                </div>
                <div style="
                  width: 100%;
                  height: 10px;
                  background: #e5e7eb;
                  border-radius: 10px;
                  overflow: hidden;
                  position: relative;
                ">
                  <div style="
                    width: ${progressPercent};
                    height: 100%;
                    background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}cc 100%);
                    border-radius: 10px;
                    position: relative;
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                  ">
                    <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
                      animation: shimmer 2s infinite;
                    "></div>
                  </div>
                </div>
              </div>

              <!-- Stats Grid -->
              <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 14px;
              ">
                <div style="
                  padding: 10px 12px;
                  background: #f9fafb;
                  border-radius: 8px;
                  border: 1px solid #e5e7eb;
                ">
                  <div style="
                    font-size: 11px;
                    color: #6b7280;
                    margin-bottom: 4px;
                    font-weight: 600;
                  ">
                    Status
                  </div>
                  <div style="
                    font-size: 13px;
                    font-weight: 700;
                    color: ${progressColor};
                  ">
                    Active
                  </div>
                </div>
                <div style="
                  padding: 10px 12px;
                  background: #f9fafb;
                  border-radius: 8px;
                  border: 1px solid #e5e7eb;
                ">
                  <div style="
                    font-size: 11px;
                    color: #6b7280;
                    margin-bottom: 4px;
                    font-weight: 600;
                  ">
                    Score
                  </div>
                  <div style="
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                  ">
                    ${progressPercent.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          </style>
        `;
        }
      },

      legend: {
        show: false
      }
    };
  }

  PillarColorByScore(pillar: any): string {
    let score = pillar.aiProgress;
    const colors = [
      "#a2c3ba", "#8eb5ab", "#79a89b", "#649b8c", "#578679",
      "#4a7167", "#3c5d54", "#2f4841", "#21342f", "#141f1c"
    ];

    if (score === null || score === undefined || isNaN(score)) {
      return "#d3d3d3";
    }

    const safeScore = Math.min(Math.max(score, 0), 100);
    const index = Math.min(Math.floor(safeScore / 10), colors.length - 1);
    return colors[index];
  }

  buildUniqueCategories(data: { pillarName: string }[]): string[] {
    const used = new Set<string>();
    return data.map(item => {
      if (!item.pillarName) return '';
      const words = item.pillarName.trim().split(/\s+/);
      let label = '';
      for (let i = 1; i <= words.length; i++) {
        const candidate = i < words.length ? words.slice(0, i).join(' ') : words.join(' ');
        if (!used.has(candidate)) {
          label = candidate + (i < words.length ? '...' : '');
          used.add(candidate);
          break;
        }
      }
      if (!label) label = words[0] + '...';
      return label;
    });
  }
}
