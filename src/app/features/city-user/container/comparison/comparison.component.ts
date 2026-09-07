import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexMarkers, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent } from 'ng-apexcharts';
import { CompareCityKpiDetailComponent } from 'src/app/shared/standAlone/compare-city-kpi-detail/compare-city-kpi-detail.component';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { GetMutiplekpiLayerRequestDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerRequestDto';
import { GetMutiplekpiLayerResultsDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto';
import { CompareCityResponseDto, ChartTableRowDto } from 'src/app/core/models/CompareCityResponseDto';
import { AnalyticalLayerResponseDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/core/services/common.service';
import { UserDataShareService } from '../../../../core/services/user-data-share.service';
import { SharedModule } from 'src/app/shared/share.module';
import { environment } from 'src/environments/environment';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { CityUserService } from '../../city-user.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
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
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.css',
  imports: [CommonModule, SharedModule, CircularScoreComponent,CompareCityKpiDetailComponent]
})
export class ComparisonComponent implements OnInit, OnDestroy {

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
  mutipleCitykpiLayerResults: GetMutiplekpiLayerResultsDto | null = null;
  viewDetailIndex = -1;
  isExportKpi =false;
  constructor(
    private cityUserService: CityUserService,
    private toaster: ToasterService,
    public commonService: CommonService,
    private userDataShareService: UserDataShareService
  ) {

  }
  ngOnDestroy(): void {
    this.userDataShareService.compareCity.set([]);
  }

  ngOnInit(): void {
    this.isLoader = true;
    this.selectedCities = this.userDataShareService.compareCity()?.map(x => x.cityID) ?? [];
    this.cityUserService
    this.GetAllKpi();
    this.getCityUserCities();
    this.$kpiChanged.pipe(debounceTime(1000)).subscribe(x => {
      this.compareCities();
    });
  }

  kpiChanged() {
    this.$kpiChanged.next(true);
  }
  GetAllKpi() {
    this.cityUserService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
          this.totalRecords = this.kpis.length;
        }
      }
    });
  }
  getCityUserCities() {
    this.cityUserService.getCityUserCities().subscribe((p) => {
      this.isLoader = false;
      this.cities = p.result || [];
      if (this.cities?.length && this.selectedCities.length < 2) {
        this.selectedCities = this.cities.slice(0, 2).map(x => x.cityID);
      }
      this.compareCities();
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
    this.cityUserService.getMutiplekpiLayerResults(payload).subscribe({
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
    this.cityUserService.compareCities(payload).subscribe({
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
      if (index === (this.compareCityResponseDto?.series ?? []).length - 1) {
        return;
      }

      const baseColor = colorPalette[index % colorPalette.length];

      // Evaluation series (solid line)
      series.push({
        name: `${cityData.name}`,
        data: cityData.aiData,
        color: baseColor,
        type: 'line'
      });
      strokeDashArray.push(0); // Solid line
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
            if (idx === cities.length - 1) {
              return;
            }
            const aiValue = city.aiData?.[dataPointIndex];
            const color = colorPalette[idx % colorPalette.length];

            tooltipHtml += `
              <div style="margin: 8px 0; padding: 8px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; border-left: 3px solid ${color};">
                <div style="font-weight: 600; color: ${color}; margin-bottom: 6px; font-size: 12px;">
                  ${city.name}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                  <span style="color: #666;">📊 Score:</span>
                  <span style="font-weight: 600; color: #333;">${aiValue.toFixed(2)}</span>
                </div>
            `;
            tooltipHtml += `</div>`;
          });

          tooltipHtml += '</div>';
          return tooltipHtml;
        }
      }
    };

    this.chartOptions = option;
  }

  getCityImage(cityID: number): string {
    return this.cities?.find(c => c.cityID === cityID)?.image || '';
  }

  getCityScore(cityID: number, isAi: boolean = false): string {
    const city = this.cities?.find(c => c.cityID === cityID);
    if (isAi) {
      return city?.aiScore?.toFixed(2) || '0';
    }
    return city?.score?.toFixed(2) || '0';
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
  exportKpiData() { 
    if (!this.selectedCities.length) {
      this.toaster.showWarning("Please select cities");
      return;
    }
    this.isExportKpi =true;
    let payload: CompareCityRequestDto = {
      cities: this.selectedCities
      
    }

    this.cityUserService.exportCompareCities(payload)
      .subscribe({
        next:(res: Blob) => {
         this.isExportKpi =false;
        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Kpi_City_Comparison.xlsx";
        a.click();
        this.toaster.showSuccess("Report downlaoded successfully");
      },
      error:()=>{
        this.isExportKpi =false;
        this.toaster.showError("There is error accure please try again!");
      }
    });
  }
}