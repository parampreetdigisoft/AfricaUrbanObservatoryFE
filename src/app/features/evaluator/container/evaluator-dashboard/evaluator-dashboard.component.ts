import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CityHistoryDto, GetCitiesSubmitionHistoryReponseDto, GetCityQuestionHistoryReponseDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { CityVM } from 'src/app/core/models/CityVM';
import { EvaluatorService } from '../../evaluator.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { AgBarSeriesOptions, AgTooltipRendererDataRow } from "ag-charts-community";
import { CommonService } from 'src/app/core/services/common.service';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ChartComponent,
} from "ng-apexcharts";


export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;

};
@Component({
  selector: 'app-evaluator-dashboard',
  templateUrl: './evaluator-dashboard.component.html',
  styleUrl: './evaluator-dashboard.component.css'
})
export class EvaluatorDashboardComponent {
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  cities: CityVM[] | null = [];
  selectedCities: number | any = '';
  cityHistory: CityHistoryDto | null = null;
  cityQuestionHistoryReponse: GetCityQuestionHistoryReponseDto | null = null;
  @ViewChild("chartPillar") chartPillar!: ChartComponent;
  public chartPillarOptions: any = {};
  isLoader: boolean = false;

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  constructor(private evaluatorService: EvaluatorService, private toaster: ToasterService, private userService: UserService, public commonService: CommonService) { }
  ngOnInit(): void {
    this.isLoader = true;
    this.getAllCitiesByUserId();
    this.GetCityHistory();
  }
  yearChanged() {
    this.GetCityHistory();
    this.getCityQuestionHistory();
  }

  ngAfterViewInit() { }

  getAllCitiesByUserId() {
    this.evaluatorService.getAllCitiesByUserId(this.userService?.userInfo?.userID).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.cities = res.result;
        if (this.cities && this.cities.length > 0) {
          this.isLoader = true;
          this.selectedCities = this.cities[0].cityID;
          this.getCityQuestionHistory();
        }
      }
    });
  }

  GetCityHistory() {
    this.evaluatorService.getCityHistory(this.userService?.userInfo?.userID ?? 0, this.commonService.getStartOfYearLocal(this.selectedYear)).subscribe({
      next: (res) => {
        this.cityHistory = res.result;
        this.GetApexPieOptions();
      }
    });
  }
  getCityQuestionHistory() {
    if (this.userService?.userInfo?.userID == null || !this.selectedCities || this.selectedCities === '' || this.selectedCities == null) {
      return;
    }
    let request: UserCityRequstDto = {
      userID: this.userService?.userInfo?.userID ?? 0,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    }
    this.evaluatorService.getCityQuestionHistory(request).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.cityQuestionHistoryReponse = res;
        if (this.cityQuestionHistoryReponse) {
          this.GetPillarBarOptions(this.cityQuestionHistoryReponse);
        }
      },
      error: (err) => {
        this.isLoader = false;
      }
    });
  }

  GetPillarBarOptions(history: GetCityQuestionHistoryReponseDto) {
    let colors = this.commonService.PillarColors;
    const rawMax = Math.max(...history.pillars.map(p => p.scoreProgress));
    const maxNumber = Math.ceil(rawMax / 10) * 10;

    let data = history.pillars
      .map((p) => ({
        pillarID: p.pillarID,
        pillarName: p.pillarName,
        totalQuestion: p.totalQuestion,
        ansQuestion: p.ansQuestion,
        score: p.score,
        scoreProgress: p.scoreProgress,
        completionRate: p.totalQuestion > 0 ? (p.ansQuestion / p.totalQuestion) * 100 : 0
      }))
      .sort((a, b) => a.scoreProgress - b.scoreProgress);

    // Generate short names with duplicate handling
    const shortNames = this.generateUniqueShortNames(data.map(d => d.pillarName));

    // Prepare data for ApexCharts
    const categories = shortNames;
    const seriesData = data.map((d, index) => ({
      x: shortNames[index],
      y: d.scoreProgress,
      fillColor: this.getBarColor(d.scoreProgress, maxNumber, colors),
      meta: {
        ansQuestion: d.ansQuestion,
        totalQuestion: d.totalQuestion,
        completionRate: d.completionRate,
        pillarName: d.pillarName,
        pillarShortName: shortNames[index]
      }
    }));

    this.chartPillarOptions = {
      series: [{
        name: 'Score Progress',
        data: seriesData
      }],
      chart: {
        type: 'bar',
        height: 500,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'transparent',
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 900,
          animateGradually: {
            enabled: true,
            delay: 100
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400
          }
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          barHeight: '70%',
          distributed: true,
          dataLabels: {
            position: 'center'
          }
        }
      },
      colors: colors,
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        offsetX: 0,
        style: {
          fontSize: '14px',
          fontWeight: 800,
          colors: ['#ffffff']
        },
        formatter: (val: number, opts: any) => {
          const percentage = val.toFixed(val >= 100 ? 0 : 1);
          return `${percentage}`;
        },
        background: {
          enabled: false
        },
      },
      stroke: {
        show: true,
        width: 0,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Score',
          style: {
            fontSize: '14px',
            fontWeight: 700,
            color: '#2d3748'
          },
          offsetY: 0
        },
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: '#718096'
          },
          formatter: (value: number) => `${value}`
        },
        axisBorder: {
          show: true,
          color: '#cbd5e0',
          height: 1,
          offsetY: 0
        },
        axisTicks: {
          show: true,
          color: '#e2e8f0',
          height: 5
        },
        min: 0,
        max: maxNumber,
        tickAmount: 5
      },
      yaxis: {
        labels: {
          show: true,
          align: 'right',
          minWidth: 0,
          maxWidth: 120,
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: '#4a5568'
          },
          offsetX: -50
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      grid: {
        show: true,
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        position: 'back',
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        padding: {
          top: 5,
          right: 30,
          bottom: 10,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        shared: false,
        followCursor: true,
        intersect: true,
        inverseOrder: false,
        theme: 'light',
        style: {
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        },
        onDatasetHover: {
          highlightDataSeries: true,
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          const meta = w.config.series[0].data[dataPointIndex].meta;
          const percentage = series[seriesIndex][dataPointIndex].toFixed(1);
          const completion = meta.completionRate.toFixed(1);
          const barColor = w.config.series[0].data[dataPointIndex].fillColor;

          const completionColor = completion >= 80 ? '#48bb78' :
            completion >= 50 ? '#ed8936' : '#f56565';

          const progressWidth = Math.min(completion, 100);

          return `
          <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 12px 28px rgba(0,0,0,0.25); overflow: hidden;  border: 2px solid ${barColor}40;">
            
            <!-- Header Section with Full Pillar Name -->
            <div style="background: linear-gradient(135deg, ${barColor} 0%, ${barColor}cc 100%); padding: 16px 20px; position: relative; overflow: hidden; min-height: 60px;">
              <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.15); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -10px; left: -10px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="font-weight: 800; font-size: 15px; color: #ffffff; text-shadow: 0 2px 8px rgba(0,0,0,0.2); position: relative; z-index: 1; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">
                ${meta.pillarName}
              </div>
            </div>

            <!-- Content Section -->
            <div style="padding: 18px 20px; background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%);">
              
              <!-- Progress Score -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; background: ${barColor}; border-radius: 50%; box-shadow: 0 0 8px ${barColor}80;"></div>
                  <span style="color: #718096; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Score</span>
                </div>
                <span style="color: ${barColor}; font-weight: 900; font-size: 24px; line-height: 1; text-shadow: 0 1px 2px ${barColor}40;">
                  ${percentage}
                </span>
              </div>

              <!-- Questions Answered -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 10px 12px; background: #f7fafc; border-left: 3px solid ${barColor}; border-radius: 6px;">
                <span style="color: #4a5568; font-weight: 600; font-size: 12px;">Questions Answered</span>
                <span style="color: #2d3748; font-weight: 700; font-size: 15px;">
                  ${meta.ansQuestion} <span style="color: #a0aec0; font-weight: 500;">/</span> ${meta.totalQuestion}
                </span>
              </div>

              <!-- Completion Rate with Progress Bar -->
              <div style="margin-top: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #4a5568; font-weight: 600; font-size: 12px;">Completion Rate</span>
                  <span style="color: ${completionColor}; font-weight: 800; font-size: 16px; text-shadow: 0 1px 2px ${completionColor}40;">
                    ${completion}%
                  </span>
                </div>
                <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); position: relative;">
                  <div style="width: ${progressWidth}%; height: 100%; background: linear-gradient(90deg, ${completionColor} 0%, ${completionColor}dd 50%, ${completionColor} 100%); border-radius: 12px; transition: width 0.5s ease; box-shadow: 0 0 12px ${completionColor}60; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        `;
        }
      },
      states: {
        normal: {
          filter: {
            type: 'none',
            value: 0
          }
        },
        hover: {
          filter: {
            type: 'lighten',
            value: 0.08
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
            value: 0.15
          }
        }
      },
      legend: {
        show: false
      },
      fill: {
        opacity: 1,
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: false,
          opacityFrom: 0.9,
          opacityTo: 1,
          stops: [0, 50, 100]
        }
      }
    };
  }

  // Helper method to generate unique short names with smart duplicate handling
  private generateUniqueShortNames(pillarNames: string[]): string[] {
    const maxLength = 8; // Maximum characters to show before "..."
    const shortNames: string[] = [];
    const nameCount: { [key: string]: number } = {};

    // First pass: create basic short names and count duplicates
    pillarNames.forEach(name => {
      const words = name.split(/[\s,/&-]+/).filter(word => word.length > 0);
      const firstWord = words[0] || name;

      // Truncate first word
      const truncated = firstWord.length > maxLength
        ? firstWord.substring(0, maxLength)
        : firstWord;

      // Count occurrences
      nameCount[truncated] = (nameCount[truncated] || 0) + 1;
    });

    // Second pass: add suffix for duplicates
    const usedNames: { [key: string]: number } = {};

    pillarNames.forEach(name => {
      const words = name.split(/[\s,/&-]+/).filter(word => word.length > 0);
      const firstWord = words[0] || name;

      // Truncate first word
      let truncated = firstWord.length > maxLength
        ? firstWord.substring(0, maxLength)
        : firstWord;

      // If this base name has duplicates, add distinguishing suffix
      if (nameCount[truncated] > 1) {
        usedNames[truncated] = (usedNames[truncated] || 0) + 1;

        // Find next word's first letter for suffix
        const suffixWord = words[usedNames[truncated]] || words[1];
        if (suffixWord) {
          const suffix = suffixWord.charAt(0).toLowerCase();
          truncated = `${truncated}...${suffix}`;
        } else {
          truncated = `${truncated}...`;
        }
      } else {
        // Single occurrence, just add "..." if truncated
        if (firstWord.length > maxLength || words.length > 1) {
          truncated = `${truncated}...`;
        }
      }

      shortNames.push(truncated);
    });

    return shortNames;
  }

  // Helper method to get bar color
  private getBarColor(scoreProgress: number, maxNumber: number, colors: string[]): string {
    if (scoreProgress === 0) {
      return '#d1d5db';
    }
    const colorIndex = Math.min(
      Math.floor((scoreProgress / maxNumber) * colors.length),
      colors.length - 1
    );
    return colors[colorIndex];
  }

  GetApexPieOptions() {
    const total = this.cityHistory?.totalCity ?? 0;
    const active = this.cityHistory?.activeCity ?? 0;
    const inprogress = this.cityHistory?.inprocessCity ?? 0;
    const complete = this.cityHistory?.compeleteCity ?? 0;

    this.chartOptions = {
      series: [
        (total / total) * 100,
        (active / total) * 100,
        (inprogress / total) * 100,
        (complete / total) * 100
      ],

      chart: {
        height: 380,
        type: "radialBar",
        toolbar: {
          show: false
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: 20,
          endAngle: 300,
          offsetY: 100,
          offsetX: 5,
          hollow: {
            margin: 0,
            size: "40%",
            background: "#25453f0d",
            image: undefined,
            position: "front",
            // dropShadow: {
            //   enabled: true,
            //   top: 3,
            //   left: 1,
            //   blur: 5,
            //   opacity: 0.44
            // }
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
              }
            },
            total: {
              show: true,
              label: "Total City",
              formatter: (value: any) => {
                return `${total}`;
              },
            }
          }
        }
      },
      colors: ["#303131", "#2ee9ca","#2d5e56", "#aaadad"],
      labels: ["Total City", "Active", "InProgress", "Completed"],
      legend: {
        show: true,
        floating: true,
        fontSize: "16px",
        position: "left",
        offsetX: 5,
        offsetY: 10,
        labels: {
          useSeriesColors: true
        },
        formatter: function (seriesName: any, opts: any) {
          return seriesName + ":  " + `${((opts.w.globals.series[opts.seriesIndex] * total) / 100).toFixed(0)}`;
        },
        itemMargin: {
          horizontal: 3
        }
      }
    };
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
}
