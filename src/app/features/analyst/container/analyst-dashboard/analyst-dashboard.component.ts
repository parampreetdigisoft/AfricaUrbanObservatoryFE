import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AgBarSeriesOptions, AgLineSeriesOptions, AgTooltipRendererDataRow } from "ag-charts-community";
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { AnalystService } from '../../analyst.service';
import { CityHistoryDto, GetCitiesSubmitionHistoryReponseDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { CityVM } from 'src/app/core/models/CityVM';
import { CommonService } from 'src/app/core/services/common.service';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ChartComponent, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexStroke, ApexTooltip, ApexDataLabels,
  ApexStates
} from "ng-apexcharts";
import { AiCityPillarDashboardResponseDto } from 'src/app/core/models/AiCityPillarDashboardResponseDto';
import { ActivatedRoute, Router } from '@angular/router';



export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;

};
export type ApexChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
};
export type PillarChartOptions = {
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
  selector: 'app-analyst-dashboard',
  templateUrl: './analyst-dashboard.component.html',
  styleUrl: './analyst-dashboard.component.css'
})
export class AnalystDashboardComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  cities: CityVM[] | null = [];
  selectedCities: number | any = '';
  cityHistory: CityHistoryDto | null = null;
  cityQuestionHistoryReponse: AiCityPillarDashboardResponseDto | null = null;
  pillarBarOptions: any = {};
  isLoader: boolean = false;
  resizeTimeout: any;
  constructor(private analystService: AnalystService, private toaster: ToasterService,
    private userService: UserService, public commonService: CommonService, private router: Router) { }
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  @ViewChild("apexchart") apexchart!: ChartComponent;
  public apexchartOptions: Partial<ApexChartOptions> = {};

  @ViewChild("chartPillar") chartPillar!: ChartComponent;
  public chartPillarOptions: Partial<PillarChartOptions> = {};

  ngAfterViewInit() { }

  ngOnInit(): void {
    this.isLoader = true;
    this.getAllCitiesByUserId();
    this.yearChanged();

  }
  yearChanged() {
    this.GetCityHistory();
    this.getCitiesProgressByUserId();
    this.getCityPillarHistory();
  }
  getCitiesProgressByUserId() {
    this.analystService.getCitiesProgressByUserId(this.userService?.userInfo?.userID ?? 0, this.commonService.getStartOfYearLocal(this.selectedYear)).subscribe({
      next: (res) => {
        if (res.succeeded && res.result) {
          this.apexchartOptions = this.getCityLineChartOptions(res.result);
        }
      }
    })
  }
  getAllCitiesByUserId() {
    this.analystService.getAllCitiesByUserId(this.userService?.userInfo?.userID).subscribe({
      next: (res) => {
        this.cities = res.result;
        this.isLoader = false;
        if (this.cities && this.cities.length > 0) {
          this.isLoader = true;
          this.selectedCities = this.cities[0].cityID;
          this.getCityPillarHistory();
        }
      }
    });
  }

  GetCityHistory() {
    this.analystService.getCityHistory(this.userService?.userInfo?.userID ?? 0, this.commonService.getStartOfYearLocal(this.selectedYear)).subscribe({
      next: (res) => {
        this.cityHistory = res.result;;
        this.GetApexPieOptions();
      }
    });
  }
  getCityPillarHistory() {
    if (this.userService?.userInfo?.userID == null || !this.selectedCities || this.selectedCities === '' || this.selectedCities == null) {
      return;
    }
    this.cityQuestionHistoryReponse = null;
    this.buildPillarComparisonChart();

    let request: UserCityRequstDto = {
      userID: this.userService?.userInfo?.userID ?? 0,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    }
    this.analystService.getCityPillarHistory(request).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.cityQuestionHistoryReponse = res.result;
        if (this.cityQuestionHistoryReponse) {
          this.buildPillarComparisonChart();
        }
      },
      error: (err) => {
        this.isLoader = false;
      }
    });
  }
  goToCityAnalysis() {
    // If cityID exists, pass it as a query parameter
    const queryParams: any = {};
    if (this.selectedCities > 0) {
      queryParams.cityID = this.selectedCities;
    }

    this.router.navigate(["/analyst/ai/city-analysis"], { queryParams });
  }

  ExportCityPillar() {
    let city = this.cities?.find((x) => x.cityID == this.selectedCities);
    if (this.cityQuestionHistoryReponse?.pillars && city) {
      var exportData = this.cityQuestionHistoryReponse?.pillars.map((x) => {
        return {
          CityName: city?.cityName,
          PillarName: x.pillarName,
          AIScore: x.aiValue?.toFixed(2),
          EvaluationScore: x.evaluationValue?.toFixed(2)
        };
      });
      this.commonService.exportExcel(exportData);
    } else {
      this.toaster.showWarning("Please select city to export the records");
    }
  }
  getCityLineChartOptions(citiesHistory: GetCitiesSubmitionHistoryReponseDto[]) {

    const evaluationColor = "#61615a";
    const aiColor = "#c0c097";

    const categories = citiesHistory.map(x => x.cityName);
    const evaluationSeries = citiesHistory.map(x => x.scoreProgress ?? 0);
    const aiSeries = citiesHistory.map(x => x.aiScore ?? 0);

    let option: Partial<ApexChartOptions> = {
      series: [
        {
          name: "Evaluation Progress",
          data: evaluationSeries,
          color: evaluationColor
        },
        {
          name: "AI Progress",
          data: aiSeries,
          color: aiColor
        }
      ],

      chart: {
        type: "line",
        height: 420,
        zoom: { enabled: false },
        toolbar: { show: false }
      },

      stroke: {
        curve: "smooth",
        width: 3
      },



      dataLabels: {
        enabled: true,
        offsetY: -8,
        formatter: (val: number, opts: any) => {
          const d = citiesHistory[opts.dataPointIndex];
          if (!d || val <= 0) return "";

          const city = d.cityName;
          const percent = val.toFixed(val >= 100 ? 0 : 1);
          return `${city} ${percent}`;
        },
        style: {
          fontSize: "11px",
          fontWeight: "600",
          colors: ["#2b2b2b"]
        },
        background: {
          enabled: true,
          borderRadius: 8,
          padding: 6,
          borderWidth: 1,
          borderColor: "#e1ebd1",
          opacity: 0.95
        }
      },

      xaxis: {
        categories,
        labels: {
          rotate: -25,
          style: { fontSize: "12px" }
        }
      },

      yaxis: {
        min: 0,
        max: 100,
        decimalsInFloat: 0,
        title: {
          text: "Submission Score",
          style: { fontSize: "13px", fontWeight: 600 }
        }
      },

      tooltip: {
        custom: ({ dataPointIndex }) => {
          const d = citiesHistory[dataPointIndex];
          if (!d) return "";

          return `
          <div style="padding:10px; font-size:12px;">
            <div style="font-weight:600; margin-bottom:6px;">
              ${d.cityName}
            </div>
            <div style="margin-top:6px; color:#666;">
              Total Answered: ${d.ansQuestion}
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:8px; height:8px; background:${evaluationColor}; border-radius:50%;"></span>
              Evaluation: <b>${(d.scoreProgress ?? 0).toFixed(1)}</b>
            </div>

            <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
              <span style="width:8px; height:8px; background:${aiColor}; border-radius:50%;"></span>
              AI Score: <b>${(d.aiScore ?? 0).toFixed(1)}</b>
            </div>

            
          </div>
        `;
        }
      }
    };

    return option;
  }


  GetApexPieOptions() {
    const total = this.cityHistory?.totalCity ?? 0;
    const active = this.cityHistory?.activeCity ?? 0;
    const inprogress = this.cityHistory?.inprocessCity ?? 0;
    const complete = this.cityHistory?.compeleteCity ?? 0;

    const finalizeCity = this.cityHistory?.finalizeCity ?? 0;
    const unFinalize = this.cityHistory?.unFinalize ?? 0;

    this.chartOptions = {
      series: [
        (total / total) * 100,
        (active / total) * 100,
        (inprogress / total) * 100,
        (complete / total) * 100,
        (finalizeCity / total) * 100,
        (unFinalize / total) * 100,
      ],

      chart: {
        height: 380,
        type: "radialBar",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: 20,
          endAngle: 300,
          offsetY: 155,
          offsetX: 10,
          hollow: {
            margin: 0,
            size: "40%",
            background: "#25453f0d",
            image: undefined,
            position: "front",
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              offsetY: -10,
            },
            value: {
              show: true,
              offsetY: 10,
              formatter: (value: number) => {
                return `${((value * total) / 100).toFixed(0)}`;
              },
            },
            total: {
              show: true,
              label: "Total City",
              formatter: (value: any) => {
                return `${total}`;
              },
            },
          },
        },
      },
      colors: [
        "#141f1c",
        "#a2c3ba",
        "#2d4e46",
        "#657e78",
        "#9aebc9",
        "#69a080",
      ],
      labels: [
        "Total",
        "Manual Active",
        "Manual In Progress",
        "Manual Completed",
        "AI Finalized",
        "AI Pending Review"
      ],
      legend: {
        show: true,
        floating: true,
        fontSize: "16px",
        position: "left",
        offsetX: 0,
        offsetY: 10,
        labels: {
          useSeriesColors: true,
        },
        formatter: function (seriesName: any, opts: any) {
          return (
            seriesName +
            ":  " +
            `${(
              (opts.w.globals.series[opts.seriesIndex] * total) /
              100
            ).toFixed(0)}`
          );
        },
        itemMargin: {
          horizontal: 3,
        },
      },
    };
  }


  buildPillarComparisonChart() {
    const data = [...(this.cityQuestionHistoryReponse?.pillars ?? [])];

    const categories = this.buildUniqueCategories(data);
    const aiSeries = data.map(x => x.aiValue);
    const evaluatorSeries = data.map(x => x.evaluationValue);
    this.chartPillarOptions = {
      series: [{
        name: 'AI Progress',
        data: aiSeries
      },
      {
        name: 'Evaluator',
        data: evaluatorSeries
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

          return `${Math.round(val)}`;
        },
        offsetY: -10,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: ['#bcc0bf']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          padding: 6,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#a4a5a5',
          opacity: 0.95
        }
      },

      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#4a7167', '#334e4e']
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
        size: data.map(p => 4),
        colors: data.map(p => this.PillarColorByScore(p.aiValue)),
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
          rotateAlways: true,
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
          text: 'Score',
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

          const progressColor = this.PillarColorByScore(pillar.aiValue);
          const evaluatorProgressColor = this.PillarColorByScore(pillar.evaluationValue);
          const progressPercent = pillar.aiValue ?? 0;
          const evaluatorProgressPercent = pillar.evaluationValue ?? 0;
          const avgScore = ((progressPercent + evaluatorProgressPercent) / 2);

          const statusText = avgScore >= 75 ? 'Excellent Performance' :
            avgScore >= 50 ? 'Strong Progress' :
              avgScore >= 25 ? 'Steady Growth' : 'Early Stage';

          const statusIcon = avgScore >= 75 ? '🌟' :
            avgScore >= 50 ? '📈' :
              avgScore >= 25 ? '⚡' : '🌱';

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
                  ${avgScore.toFixed(0)}
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
                  <span>AI</span>
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
                    width: ${progressPercent}%;
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
                  <span>Evaluation</span>
                  <span>${evaluatorProgressPercent.toFixed(1)}</span>
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
                    width: ${evaluatorProgressPercent}%;
                    height: 100%;
                    background: linear-gradient(90deg, ${evaluatorProgressColor} 0%, ${evaluatorProgressColor}cc 100%);
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
                    Difference
                  </div>
                  <div style="
                    font-size: 13px;
                    font-weight: 700;
                    color: ${evaluatorProgressColor};
                  ">
                    ${Math.abs(progressPercent - evaluatorProgressPercent).toFixed(0)}
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
                    Avg Score
                  </div>
                  <div style="
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                  ">
                   ${avgScore.toFixed(0)}
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

  PillarColorByScore(score: any): string {
    //let score = pillar.aiValue;
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
