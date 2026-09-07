import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import {
  CityHistoryDto,
  CityPillarQuestionHistoryReponseDto,
  GetCityQuestionHistoryReponseDto,
  UserCityRequstDto,
} from "src/app/core/models/cityHistoryDto";
import { CityVM } from "src/app/core/models/CityVM";
import { CommonService } from "src/app/core/services/common.service";
import { CityUserService } from "../../city-user.service";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { TieredAccessPlanValue } from "src/app/core/enums/TieredAccessPlan";
declare var bootstrap: any;
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ApexStroke,
  ApexLegend,
  ApexTooltip,
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  legend: ApexLegend;
  colors: string[];
  tooltip?: ApexTooltip;
};

@Component({
  selector: "app-city-user-dashboard",
  templateUrl: "./city-user-dashboard.component.html",
  styleUrl: "./city-user-dashboard.component.css",
})
export class CityUserDashboardComponent implements OnInit, OnDestroy {
  selectedYear = new Date().getFullYear();
  cities: CityVM[] | null = [];
  selectedCities: number | any = "";
  pillars: PillarsVM[] = [];
  cityHistory: CityHistoryDto | null = null;
  cityQuestionHistoryReponse: GetCityQuestionHistoryReponseDto | null = null;
  pillarBarOptions: any = {};
  cityLineOptions: any = {};
  isLoader: boolean = false;
  urlBase = environment.apiUrl;
  selectedPillar: CityPillarQuestionHistoryReponseDto | null = null;
  chooseKpisLayers: boolean = false;
  loading: boolean = false;
  minPillar: CityPillarQuestionHistoryReponseDto | null = null;
  maxPillar: CityPillarQuestionHistoryReponseDto | null = null;
  tier: TieredAccessPlanValue = TieredAccessPlanValue.Pending;

  @ViewChild("chartContainer") chartContainer!: ElementRef;
  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: { type: 'radialBar' }
  };

  intervalId: any;
  constructor(
    private cityUserService: CityUserService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService,
    private router: Router
  ) {
    this.tier = this.userService?.userInfo?.tier || 0;
  }
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngAfterViewInit() { }

  ngOnInit(): void {
    this.isLoader = true;
    this.getCityUserCities();
    this.GetCityHistory();
  }
  yearChanged() {
    this.GetCityHistory();
    this.getCityQuestionHistory();
  }

  get cityInfo() {
    return this.cities?.find((x) => x.cityID == this.selectedCities);
  }
  getAllPillars() {
    this.cityUserService.getAllPillars().subscribe({
      next: (res) => {
        this.pillars = res.result ?? [];
      },
    });
  }
  getCityUserCities() {
    this.cityUserService.getCityUserCities().subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded) {
          this.cities = res.result;
          if (this.cities && this.cities.length > 0) {
            this.isLoader = true;
            this.selectedCities = this.cities[0].cityID;
            this.getCityQuestionHistory();
          } else {
            this.chooseKpisLayers = true;
            this.getAllPillars();
            this.opendialog();
          }
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
  GetCityHistory() {
    this.cityUserService.getCityHistory().subscribe({
      next: (res) => {
        this.cityHistory = res.result;
      },
    });
  }
  getCityQuestionHistory() {
    if (this.userService?.userInfo?.userID == null || !this.selectedCities || this.selectedCities === "" || this.selectedCities == null) {
      this.toaster.showWarning("Please select one city to view the records")
      return;
    }
    let request: UserCityRequstDto = {
      userID: this.userService?.userInfo?.userID ?? 0,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
    };
    this.cityUserService.getCityQuestionHistory(request).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.cityQuestionHistoryReponse = res;
        if (this.cityQuestionHistoryReponse) {

          // Filter accessible pillars
          const accessiblePillars =
            this.cityQuestionHistoryReponse.pillars.filter((p) => p.isAccess);

          this.minPillar = accessiblePillars.sort((x, y) => x.scoreProgress - y.scoreProgress)[0]
          this.maxPillar = accessiblePillars.sort((x, y) => y.scoreProgress - x.scoreProgress)[0]

          this.selectedPillar =
            this.cityQuestionHistoryReponse.pillars.length > 0
              ? this.cityQuestionHistoryReponse.pillars[0]
              : null;
          this.SetApexRadialBarOptions();
        }
      },
      error: (err) => {
        this.isLoader = false;
      },
    });
  }

  ExportCityPillar() {
    let city = this.cities?.find((x) => x.cityID == this.selectedCities);
    if (this.cityQuestionHistoryReponse?.pillars && city) {
      var exportData = this.cityQuestionHistoryReponse?.pillars.map((x) => {
        return {
          CityName: city?.cityName,
          PillarName: x.pillarName,
          Score: x.scoreProgress?.toFixed(2),
          AnsweredQuestion: x.ansQuestion,
          TotalQuestion: x.totalQuestion,
        };
      });
      this.commonService.exportExcel(exportData);
    } else {
      this.toaster.showWarning("Please select city to export the records");
    }
  }

  pillarChanged(pillar: CityPillarQuestionHistoryReponseDto) {
    if (pillar?.isAccess) {
      this.selectedPillar = pillar;
      this.SetApexRadialBarOptions();
    }
  }

  opendialog() {
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
    const homeTab = document.querySelector("#pills-home-tab") as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }
  SelectedKpisLayers(event: any) {
    this.loading = true;
    this.cityUserService.addCityUserKpisCityAndPillar(event).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.succeeded) {
          this.closeModal();
          this.toaster.showSuccess("Access granted successfully");
          this.ngOnInit();
        } else {
          this.toaster.showWarning("Access may not granted. Please try again");
        }
      },
      error: (err) => {
        this.toaster.showError("Something went wrong");
        this.loading = false;
      },
    });
  }

  SetApexRadialBarOptions(refresh: boolean = true) {
    if (this.selectedPillar?.scoreProgress == 0 && !refresh) return;

    const pillarScore: number = this.selectedPillar?.scoreProgress ?? 0;
    const cityScore: number = this.cityQuestionHistoryReponse?.scoreProgress ?? 0;
    const minScore: number = this.minPillar?.scoreProgress ?? 0;
    const maxScore: number = this.maxPillar?.scoreProgress ?? 0;
    const pillarColors = this.commonService.PillarColors;
    this.chartOptions = {
      series: [cityScore, pillarScore, maxScore, minScore],
      chart: {
        height: 360,
        width: 670,
        type: "radialBar",
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 450
          }
        },
        background: 'transparent',
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 4,
          opacity: 0.15
        }
      },

      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          offsetX: 70,
          offsetY: 0,
          hollow: {
            size: "40%",
            background: "transparent",
            dropShadow: {
              enabled: true,
              top: 2,
              left: 0,
              blur: 8,
              opacity: 0.12
            }
          },
          track: {
            show: true,
            background: "#e7e7e7",
            strokeWidth: "100%",
            opacity: 0.25,
            margin: 8,
            dropShadow: {
              enabled: true,
              top: 0,
              left: 0,
              blur: 2,
              opacity: 0.08
            }
          },
          dataLabels: {
            name: {
              show: true,
              offsetY: -15,
              fontSize: '15px',
              fontWeight: 600,
              color: '#3c5d54',
              fontFamily: 'inherit'
            },
            value: {
              show: true,
              offsetY: 8,
              fontSize: "28px",
              fontWeight: 700,
              color: '#2f4841',
              fontFamily: 'inherit',
              formatter: (v: any) => {
                const value = Number(v);
                return isNaN(value) ? '0' : value.toFixed(1) + '';
              }
            },
            total: {
              show: true,
              label: "Pillar Score",
              fontSize: '16px',
              fontWeight: 600,
              color: "#4a7167",
              formatter: (w: any) => (w.globals.series[1] ?? 0).toFixed(1) + '',
            },
          },
        },
      },

      labels: [
        "City ",
        "Pillar",
        "Max",
        "Min",
      ],

      colors: ["#2f4841", "#4a7167", "#79a89b", "#a2c3ba"],

      stroke: {
        lineCap: "round",
      },

      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#3c5d54', '#578679', '#8eb5ab', '#b8d4cc'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.85,
          stops: [0, 100]
        }
      },

      legend: {
        show: true,
        floating: true,
        position: "left",
        horizontalAlign: "left",
        offsetX: 75,
        offsetY: -35,
        fontSize: "15px",
        fontWeight: 600,
        fontFamily: 'inherit',
        labels: {
          colors: '#2f4841',
          useSeriesColors: false,
        },
        markers: {
          width: 14,
          height: 14,
          radius: 14,
          offsetX: -5,
          offsetY: 1,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 12,
        },
        formatter: (seriesName: string, opts: any) => {
          const value = opts.w.globals.series[opts.seriesIndex] ?? 0;
          return `<span style="color: #2e4740; font-weight: 600;">${seriesName}</span>: <span style="color: #4a7167; font-weight: 700;">${value.toFixed(2)}</span>`;
        },
      },

      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: 'light',
        style: {
          fontSize: '14px',
          fontFamily: 'inherit'
        },
        y: {
          formatter: (val: number) => val.toFixed(2) + ''
        },
        marker: {
          show: true,
        },
        custom: ({ series, seriesIndex, w }) => {
          let name = 'Pillar';
          if (seriesIndex == 0) {
            name = this.cityInfo?.cityName ?? 'City';
          }
          else if (seriesIndex == 1) {
            name = this.selectedPillar?.pillarName ?? 'Pillar';
          }
          else if (seriesIndex == 2) {
            name = this.maxPillar?.pillarName ?? 'Max Pillar';
          }
          else if (seriesIndex == 3)
            name = this.minPillar?.pillarName ?? 'Min Pillar';


          const value = series[seriesIndex];
          const color = pillarColors[seriesIndex % pillarColors.length];
          const lightBg = `${color}1A`; // ~10% opacity

          return `
          <div style="
            padding: 14px 16px;
            min-width: 220px;
            background: linear-gradient(135deg, #ffffff, #f7faf9);
            border-radius: 12px;
            border-left: 5px solid ${color};
            box-shadow: 0 10px 25px rgba(0,0,0,0.12);
            font-family: Inter, sans-serif;
          ">

            <!-- Header -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 10px;
              font-size: 13px;
              font-weight: 600;
              color: #1f2937;
            ">
              <span style="
                width: 10px;
                height: 10px;
                background: ${color};
                border-radius: 50%;
                display: inline-block;
              "></span>
              ${name}
            </div>

            <!-- Score -->
            <div style="
              font-size: 28px;
              font-weight: 700;
              color: ${color};
              line-height: 1;
            ">
              ${value.toFixed(1)}
            </div>

            <!-- Progress bar -->
            <div style="
              margin-top: 10px;
              height: 6px;
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                width: ${value};
                height: 100%;
                background: linear-gradient(90deg, ${color}, #a2c3ba);
                border-radius: 4px;
              "></div>
            </div>

            <!-- Footer -->
            <div style="
              margin-top: 10px;
              padding: 6px 10px;
              background: ${lightBg};
              border-radius: 6px;
              font-size: 11px;
              color: #374151;
              display: flex;
              justify-content: space-between;
            ">
              <span>${this.cityInfo?.cityName}</span>
              <strong>${cityScore.toFixed(2)}</strong>
            </div>
          </div>
        `;
        }

      }
    };
  }
}
