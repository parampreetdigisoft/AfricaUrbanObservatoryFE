import { Component, OnInit, ViewChild } from "@angular/core";
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexTooltip, ApexDataLabels, ChartComponent, ApexGrid, ApexLegend, ApexMarkers } from "ng-apexcharts";
import { Subject, debounceTime } from "rxjs";
import { CityVM } from "src/app/core/models/CityVM";
import { CompareCityRequestDto } from "src/app/core/models/CompareCityRequestDto";
import { CompareCityResponseDto, ChartTableRowDto } from "src/app/core/models/CompareCityResponseDto";
import { AnalyticalLayerResponseDto } from "src/app/core/models/GetAnalyticalLayerResultDto";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { CommonService } from "src/app/core/services/common.service";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
import { AnalystService } from "../../analyst.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { CircularScoreComponent } from "src/app/shared/standAlone/circular-score/circular-score.component";
import { AiButtonComponent } from "src/app/shared/standAlone/ai-button/ai-button.component";
import { GetMutiplekpiLayerResultsDto } from "src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto";
import { GetMutiplekpiLayerRequestDto } from "src/app/core/models/aiVm/GetMutiplekpiLayerRequestDto";
import { CompareCityKpiDetailComponent } from "src/app/shared/standAlone/compare-city-kpi-detail/compare-city-kpi-detail.component";
declare var bootstrap: any; // 👈 use Bootstrap JS API
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  legend: ApexLegend;
  grid: ApexGrid;

};

@Component({
  standalone: true,
  selector: 'app-kpi-comparision',
  templateUrl: './kpi-comparision.component.html',
  styleUrl: './kpi-comparision.component.css',
  imports: [CommonModule, SharedModule, CircularScoreComponent,AiButtonComponent,CompareCityKpiDetailComponent]
})
export class KpiComparisionComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  pillers: PillarsVM[] = [];
  selectedCities: number[] = [];
  selectedKpis: number[] = [];
  cities: CityVM[] | null = [];
  pageSize: number = 10;
  currentPage: number = 1;
  totalRecords: number = 10;
  kpis: AnalyticalLayerResponseDto[] = [];
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> = {};
  compareCityResponseDto: CompareCityResponseDto | null = null;
  isLoader: boolean = false;
  environment = environment.apiUrl;
  chartTableData: ChartTableRowDto[] = [];
  $kpiChanged = new Subject();
  isAiViewEnabled: boolean = false;
  mutipleCitykpiLayerResults: GetMutiplekpiLayerResultsDto | null = null;
  viewDetailIndex = -1;
  constructor(
    private analystService: AnalystService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) {

  }

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllKpi();
    this.getCityUserCities();
    this.$kpiChanged.pipe(debounceTime(1000)).subscribe(x => {
      this.compareCities();
    });
  }
  onAiViewToggle(value: boolean) {
    this.isAiViewEnabled = value; // 👈 REQUIRED
    this.getChartOptions();
  }
  kpiChanged() {
    this.$kpiChanged.next(true);
  }
  GetAllKpi() {
    this.analystService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
          this.totalRecords = this.kpis.length;
        }
      }
    });
  }
  getCityUserCities() {
    this.analystService.getAllCitiesByUserId(this.userService.userInfo.userID ?? 0).subscribe((p) => {
      this.isLoader = false;
      this.cities = p.result || [];
      if (this.cities?.length && this.selectedCities.length < 2) {
        this.selectedCities = this.cities.slice(0, 2).map(x => x.cityID);
        this.compareCities();
      }
    });
  }
  getMutiplekpiLayerResults(layerID: number, viewDetailIndex:number) {

    if (this.selectedCities.length < 1) {
      this.compareCityResponseDto = null;
      this.getChartOptions();
      this.toaster.showWarning("Please select at least one city to view data.");
      return;
    }

    this.viewDetailIndex = viewDetailIndex;

    let payload: GetMutiplekpiLayerRequestDto = {
      cityIDs: this.selectedCities,
      year: this.selectedYear,
      layerID: layerID
    }
    this.analystService.getMutiplekpiLayerResults(payload).subscribe({
      next: (res) => {
        this.viewDetailIndex = -1;
        if (res.succeeded) {
          this.mutipleCitykpiLayerResults = res.result || null;
          const sidebarEl = document.getElementById('kpiLayerSidebar');
          const offcanvas = new bootstrap.Offcanvas(sidebarEl);
          offcanvas.show();
        }
        else {
          this.toaster.showInfo("No comparison data available for the selected cities.");
        }
      },
      error: (err) => {
        this.viewDetailIndex = -1;
        this.toaster.showError("Failed to load comparison data.");
      }
    });
  }
  compareCities(currentPage = 1) {
    if (this.selectedCities.length < 1) {
      this.compareCityResponseDto = null;
      this.getChartOptions();
      this.toaster.showWarning("Please select at least one city to view data.");
      return;
    }
    this.isLoader = true;
    this.currentPage = currentPage;

    let payload: CompareCityRequestDto = {
      cities: this.selectedCities,
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      Kpis: this.selectedKpis
    }
    this.analystService.compareCities(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded) {
          this.compareCityResponseDto = res.result || null;
          this.getChartOptions();
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

  getChartOptions() {
    this.chartTableData = this.compareCityResponseDto?.tableData ?? [];

    if (!this.chartTableData?.length) {
      this.totalRecords = 0;
    } else {
      this.totalRecords = this.kpis.length;
    }

    const kpiMap = new Map(
      this.chartTableData.map(x => [x.layerCode, x.layerName])
    );

    const colorPalette = this.commonService.kpiColors;
    
    let series: any[] = [];
    let strokeDashArray: number[] = [];

    (this.compareCityResponseDto?.series ?? []).forEach((cityData, index) => {
      // Skip the last city if AI View is enabled (assuming last city is AI benchmark)
      if (index === (this.compareCityResponseDto?.series ?? []).length - 1 && this.isAiViewEnabled) {
        return;
      }

      const baseColor = colorPalette[index % colorPalette.length];

      // Evaluation series (solid line)
      series.push({
        name: `${cityData.name} (Evaluation)`,
        data: cityData.data,
        color: baseColor,
        type: 'line'
      });
      strokeDashArray.push(0); // Solid line

      // AI series (dashed line) - only if AI view is enabled
      if (this.isAiViewEnabled && cityData.aiData) {
        series.push({
          name: `${cityData.name} (AI)`,
          data: cityData.aiData,
          color: this.lightenColor(baseColor, 20), // Slightly lighter shade
          type: 'line'
        });
        strokeDashArray.push(8); // Dashed line
      }
    });

    let option: Partial<ChartOptions> = {
      series: series,
      chart: {
       height: 400,
        type: "line",
        zoom: {
          enabled: false,
          type: 'x'
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        } as any
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 3,
        dashArray: strokeDashArray // Different dash patterns for each series
      },
      markers: {
        size: 5,
        strokeWidth: 2,
        hover: {
          size: 7,
          sizeOffset: 3
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        markers: {
          width: 20,
          height: 3,
          radius: 0
        } as any,
        itemMargin: {
          horizontal: 15,
          vertical: 5
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        strokeDashArray: 3,
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      xaxis: {
        type: "category",
        categories: this.compareCityResponseDto?.categories,
        labels: {
          rotate: -15,
          rotateAlways: true,
          style: {
            fontSize: '11px',
            fontWeight: 500
          },
          trim: false
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: true,
          color: '#78909C'
        },
        axisTicks: {
          show: true,
          color: '#78909C'
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 10,
        forceNiceScale: true,
        decimalsInFloat: 0,
        labels: {
          show: true,
          formatter: (val: number) => parseInt(val.toString(), 10).toString(),
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        title: {
          text: "Score Difference",
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#263238'
          }
        },
        axisBorder: {
          show: true,
          color: '#78909C'
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const layerCode = this.compareCityResponseDto?.categories?.[dataPointIndex] ?? "";
          const layerName = kpiMap.get(layerCode) ?? "";

          let tooltipHtml = `
          <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 250px;">
            <div style="font-weight: 600; margin-bottom: 10px; color: #333; font-size: 13px; border-bottom: 2px solid #e7e7e7; padding-bottom: 6px;">
              ${layerCode} - ${layerName}
            </div>
        `;

          // Group evaluation and AI values together
          const cities = this.compareCityResponseDto?.series ?? [];
          cities.forEach((city, idx) => {
            // Skip last city if it's the AI benchmark
            if (idx === cities.length - 1 && this.isAiViewEnabled) {
              return;
            }

            const evalValue = city.data[dataPointIndex];
            const aiValue = city.aiData?.[dataPointIndex];
            const color = colorPalette[idx % colorPalette.length];
            const difference = aiValue != null ? (evalValue - aiValue) : 0;

            tooltipHtml += `
            <div style="margin: 8px 0; padding: 8px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; border-left: 3px solid ${color};">
              <div style="font-weight: 600; color: ${color}; margin-bottom: 6px; font-size: 12px;">
                ${city.name}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                <span style="color: #666;">📊 Evaluation:</span>
                <span style="font-weight: 600; color: #333;">${evalValue.toFixed(2)}</span>
              </div>
          `;

            if (this.isAiViewEnabled && aiValue != null) {
              tooltipHtml += `
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                <span style="color: #666;">🤖 AI:</span>
                <span style="font-weight: 600; color: #333;">${aiValue.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #dee2e6;">
                <span style="color: #666;">📈 Difference:</span>
                <span style="font-weight: 600; color: ${Math.abs(difference) > 10 ? '#dc3545' : '#28a745'};">
                  ${difference > 0 ? '+' : ''}${difference.toFixed(2)}
                </span>
              </div>
            `;
            }

            tooltipHtml += `</div>`;
          });

          tooltipHtml += '</div>';
          return tooltipHtml;
        }
      }
    };

    this.chartOptions = option;
  }

  // Helper function to lighten colors for AI lines
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  getCityScore(cityID: number, isAi: boolean = false): string {
    const city = this.cities?.find(c => c.cityID === cityID);
    if (isAi) {
      return city?.aiScore?.toFixed(2) || '0';
    }
    return city?.score?.toFixed(2) || '0';
  }

  getCityImage(cityID: number): string {
    return this.cities?.find(c => c.cityID === cityID)?.image || '';
  }


  getCityCountry(cityID: number): string {
    return this.cities?.find(c => c.cityID === cityID)?.country || '';
  }

  getCityState(cityID: number): string {
    return this.cities?.find(c => c.cityID === cityID)?.state || '';
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  getPeerScore(): string {

    if (!this.chartTableData?.length) return 'NA';

    const peerCities = this.cities?.filter(city =>
      this.chartTableData[0].cityValues?.some(row => row.cityID === city.cityID)
    ) ?? [];

    const avgPeerCityScore =
      peerCities.length > 0
        ? peerCities.reduce((sum, row) => sum + (row.score ?? 0), 0) / peerCities.length
        : 0;

    return avgPeerCityScore.toFixed(2);
  }
  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
}