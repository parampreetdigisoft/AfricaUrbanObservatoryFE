import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexMarkers, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent } from 'ng-apexcharts';
import { AiCrossCityResponseDto, ChartTableRowDto, PillarValueDto, PillarWiseScoreDto } from 'src/app/core/models/aiVm/AiCrossCityResponseDto';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CommonService } from 'src/app/core/services/common.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/shared/share.module';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { environment } from 'src/environments/environment';
import { CityUserService } from '../../city-user.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { ChatService } from 'src/app/core/services/chat.service';
import { Router } from '@angular/router';
import { UserRole } from 'src/app/core/enums/UserRole';
import { UtcToLocalTooltipDirective } from 'src/app/shared/directives/utc-to-local-tooltip.directive';
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
  colors: string[];
  fill: any;
  plotOptions: any;
  responsive: any;
};
@Component({
  selector: 'app-ai-city-comparison',
  standalone: true,
  imports: [CommonModule, SharedModule, CircularScoreComponent, UtcToLocalTooltipDirective],
  templateUrl: './ai-city-comparison.component.html',
  styleUrl: './ai-city-comparison.component.css'
})
export class AiCityComparisonComponent implements OnInit {
  pillars: PillarsVM[] = [];
  filterPillars: PillarsVM[] = [];
  selectedPillars: number[] = [];
  selectedCities: number[] = [];
  cities: CityVM[] | null = [];
  @ViewChild("chart") chart!: ChartComponent;
  public radarChartOptions: Partial<ChartOptions> = {};
  compareCityResponseDto: AiCrossCityResponseDto | null = null;
  isLoader: boolean = false;
  environment = environment.apiUrl;
  chartTableData: ChartTableRowDto[] = [];
  $pillarChanged = new Subject();
  pillarWiseData: PillarWiseScoreDto[] = [];
  maxCity?: ChartTableRowDto;
  highestPillar?: PillarValueDto;
  lowestPillar?: PillarValueDto;
  avgScore?: number;

  constructor(
    private cityUserService: CityUserService,
    private toaster: ToasterService,
    private aiComputationService: AiComputationService,
    public commonService: CommonService,
    private chatService:ChatService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllKpi();
    this.getCityUserCities();
    this.$pillarChanged.pipe(debounceTime(1000)).subscribe(x => {
      this.compareCities();
    });
  }

  pillarChanged() {
    this.$pillarChanged.next(true);
  }
  getPillarName(pillarId: number): string {
    return this.filterPillars.find(p => p.pillarID === pillarId)?.pillarName ?? '';
  }

  GetAllKpi() {
    this.cityUserService.getAllPillars().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.pillars = res.result ?? [];
          this.filterPillars = [...this.pillars];
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
        this.compareCities();
      }
    });
  }

  compareCities() {
    if (this.selectedCities.length < 1) {
      this.compareCityResponseDto = null;
      this.getRadarChartOptions();
      this.toaster.showWarning("Please select at least one city to view data.");
      return;
    }
    this.isLoader = true;
    this.aiComputationService.getAICrossCityPillars(this.selectedCities).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded) {
          this.compareCityResponseDto = res.result || null;
          this.chartTableData = this.compareCityResponseDto?.tableData ?? [];
          this.getTablePillarWiseData();
          this.getRadarChartOptions();
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
  getTablePillarWiseData() {
    this.pillarWiseData = [];
    let tableData = this.compareCityResponseDto?.tableData ?? [];

    tableData.forEach(city => {
      city.pillarValues.forEach(pillar => {
        let existingPillar = this.pillarWiseData.find(p => p.pillarID === pillar.pillarID);

        if (!existingPillar) {
          existingPillar = {
            pillarID: pillar.pillarID,
            pillarName: pillar.pillarName,
            displayOrder: pillar.displayOrder,
            isAccess: pillar.isAccess,
            imagePath: this.pillars.find(p => p.pillarID === pillar.pillarID)?.imagePath || '',
            values: []
          };
          this.pillarWiseData.push(existingPillar);
        }

        existingPillar.values.push({
          cityID: city.cityID,
          cityName: city.cityName,
          value: pillar.value
        });
      });
    });
    this.filterPillars = this.pillars.filter(p => this.pillarWiseData.some(pw => pw.pillarID === p.pillarID && pw.isAccess));
    this.calculatePillarCards();
  }

  getRadarChartOptions() {
    // Enhanced color palette with better contrast and visual appeal
    const colorPalette = this.commonService.radarColors;

    // Prepare series data for radar chart
    const series: any[] = [];
    let categories: string[] = [];

    if (this.selectedPillars.length > 0) {
      let pillarSequece = this.chartTableData.at(0)?.pillarValues.filter(x => x.isAccess).map(x => x.pillarID) || [];
      const indexes = pillarSequece
        .map((pillarID, idx) => this.selectedPillars.includes(pillarID) ? idx : -1)
        .filter(idx => idx !== -1);

      categories = this.compareCityResponseDto?.categories.filter((_, idx) => indexes.includes(idx)).map(cat => cat) || [];


      (this.compareCityResponseDto?.series ?? []).forEach((cityData, index) => {

        series.push({
          name: cityData.name,
          data: cityData.data.filter((_, idx) => indexes.includes(idx))
        });
      });

    } else {
      categories = this.compareCityResponseDto?.categories || [];
      (this.compareCityResponseDto?.series ?? []).forEach((cityData, index) => {

        series.push({
          name: cityData.name,
          data: cityData.data
        });
      });
    }
    // Radar chart options with enhanced styling
    const radarOptions: Partial<ChartOptions> = {
      series: series,
      chart: {
        height: 500,
        type: 'radar',
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: true
          },
          export: {
            csv: {
              filename: 'cross-city-comparison',
              headerCategory: 'Category',
            },
            svg: {
              filename: 'cross-city-radar'
            },
            png: {
              filename: 'cross-city-radar'
            }
          }
        },
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
            speed: 350
          }
        },
        dropShadow: {
          enabled: true,
          blur: 8,
          left: 0,
          top: 0,
          opacity: 0.15
        },
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      },
      colors: colorPalette.map(c => c.primary),
      stroke: {
        show: true,
        width: 2.5,
        colors: colorPalette.map(c => c.primary),
        dashArray: 0
      },
      fill: {
        opacity: 0.25,
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: colorPalette.map(c => c.light),
          inverseColors: false,
          opacityFrom: 0.4,
          opacityTo: 0.15,
          stops: [0, 100]
        }
      },
      markers: {
        size: 5,
        strokeWidth: 2,
        strokeColors: '#fff',
        colors: colorPalette.map(c => c.primary),
        hover: {
          size: 10,
          sizeOffset: 2
        },
        discrete: []
      },
      xaxis: {
        categories: categories,
        labels: {
          show: true,
          style: {
            colors: Array(categories?.length).fill('#374151'),
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          formatter: (value: string) => {
            // Truncate long category names
            return value.length > 15 ? value.substring(0, 15) + '...' : value;
          }
        }
      },
      yaxis: {
        show: true,
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: '#6b7280',
            fontSize: '11px',
            fontWeight: 500
          },
          formatter: (val: number) => `${val.toFixed(0)}`
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        offsetY: 10,
        markers: {
          width: 14,
          height: 14,
          strokeWidth: 0,
          radius: 3,
          offsetX: -5,
          offsetY: 0
        },
        itemMargin: {
          horizontal: 16,
          vertical: 8
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        },
        formatter: (seriesName: string, opts: any) => {
          const seriesIndex = opts.seriesIndex;
          const avgScore = series[seriesIndex].data.reduce((a: number, b: number) => a + b, 0) / series[seriesIndex].data.length;
          return `${seriesName} <span style="color: #9ca3af; font-weight: 400; margin-left: 4px;">(Avg: ${avgScore.toFixed(1)})</span>`;
        }
      },
      plotOptions: {
        radar: {
          size: 220,
          offsetX: 0,
          offsetY: 0,
          polygons: {
            strokeColors: '#e5e7eb',
            strokeWidth: 1.5,
            connectorColors: '#e5e7eb',
            fill: {
              colors: ['#f9fafb', '#f3f4f6']
            }
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        onDatasetHover: {
          highlightDataSeries: true
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const categoryCode = this.compareCityResponseDto?.categories?.[dataPointIndex] ?? "";

          // Find the full category name from tableData
          const categoryData = this.chartTableData.find(x => x.cityName === categoryCode);
          const categoryName = categoryData?.cityName ?? categoryCode;

          let tooltipHtml = `
          <div style="
            padding: 16px; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
            border-radius: 12px; 
            box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
            min-width: 280px;
            border: 1px solid #e2e8f0;
          ">
            <div style="
              font-weight: 700; 
              margin-bottom: 12px; 
              color: #1e293b; 
              font-size: 14px; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                width: 8px; 
                height: 8px; 
                background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                border-radius: 50%;
                display: inline-block;
              "></span>
              ${categoryName}
            </div>
            `;

          // Get all cities' scores for this category
          const cityScores: Array<{ name: string, score: number, color: string, index: number }> = [];

          (this.compareCityResponseDto?.series ?? []).forEach((cityData, idx) => {
            const score = cityData.data[dataPointIndex];
            const colors = colorPalette[idx % colorPalette.length];
            cityScores.push({
              name: cityData.name,
              score: score,
              color: colors.primary,
              index: idx
            });
          });

          // Sort by score (highest first)
          cityScores.sort((a, b) => b.score - a.score);

          // Display each city's score
          cityScores.forEach((city, rank) => {
            const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`;
            const scoreColor = city.score >= 80 ? '#059669' : city.score >= 60 ? '#d97706' : '#dc2626';

            tooltipHtml += `
            <div style="
              margin: 8px 0; 
              padding: 10px 12px; 
              background: ${city.color}08; 
              border-radius: 8px; 
              border-left: 3px solid ${city.color};
              transition: all 0.2s ease;
            ">
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                gap: 12px;
              ">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                  <span style="font-size: 16px;">${rankEmoji}</span>
                  <span style="
                    font-weight: 600; 
                    color: ${city.color}; 
                    font-size: 13px;
                  ">${city.name}</span>
                </div>
                <div style="
                  font-weight: 700; 
                  font-size: 18px; 
                  color: ${scoreColor};
                  min-width: 60px;
                  text-align: right;
                ">${city.score.toFixed(1)}</div>
              </div>
              
              <!-- Score bar -->
              <div style="
                margin-top: 8px; 
                height: 6px; 
                background: #e2e8f0; 
                border-radius: 3px; 
                overflow: hidden;
              ">
                <div style="
                  height: 100%; 
                  width: ${city.score}; 
                  background: linear-gradient(90deg, ${city.color}, ${colorPalette[city.index].light});
                  border-radius: 3px;
                  transition: width 0.3s ease;
                "></div>
              </div>
            </div>
          `;
          });

          // Add statistics footer
          const avgScore = cityScores.reduce((sum, city) => sum + city.score, 0) / cityScores.length;
          const maxScore = cityScores[0].score;
          const minScore = cityScores[cityScores.length - 1].score;
          const spread = maxScore - minScore;

          tooltipHtml += `
          <div style="
            margin-top: 12px; 
            padding-top: 12px; 
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-around;
            font-size: 11px;
            color: #64748b;
          ">
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #475569;">Avg</div>
              <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${avgScore.toFixed(1)}</div>
            </div>
            <div style="width: 1px; background: #e2e8f0;"></div>
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #475569;">Range</div>
              <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${spread.toFixed(1)}</div>
            </div>
            <div style="width: 1px; background: #e2e8f0;"></div>
            <div style="text-align: center;">
              <div style="font-weight: 600; color: #475569;">Best</div>
              <div style="font-weight: 700; color: #059669; margin-top: 2px;">${maxScore.toFixed(1)}</div>
            </div>
          </div>
        `;

          tooltipHtml += '</div>';
          return tooltipHtml;
        }
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 500
            },
            plotOptions: {
              radar: {
                size: 180
              }
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 450
            },
            plotOptions: {
              radar: {
                size: 150
              }
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '10px'
                }
              }
            }
          }
        }
      ]
    };

    this.radarChartOptions = radarOptions;
  }

  getCityScore(cityID: number, isAi: boolean = false): string {
    const city = this.cities?.find(c => c.cityID === cityID);
    if (isAi) {
      return city?.aiScore?.toFixed(2) || '0';
    }
    return city?.score?.toFixed(2) || '0';
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
  private calculatePillarCards(): void {
    if (!this.chartTableData?.length) return;

    /* MAX CITY */
    this.maxCity = [...this.chartTableData]
      .sort((a, b) => a.value - b.value)
      .pop();

    let pillarValues = this.chartTableData.flatMap(x => x.pillarValues).filter(x => x.isAccess);
    /* HIGHEST PILLAR */
    this.highestPillar = pillarValues.reduce((max, curr) => curr.value > max.value ? curr : max);
    if (this.highestPillar) {
      let image = this.pillars.find(p => p.pillarID === this.highestPillar?.pillarID)?.imagePath || '';
      this.highestPillar.imagePath = image;
    }

    /* LOWEST PILLAR */
    this.lowestPillar = pillarValues.reduce((min, curr) => curr.value < min.value ? curr : min);
    if (this.lowestPillar) {
      let image = this.pillars.find(p => p.pillarID === this.lowestPillar?.pillarID)?.imagePath || '';
      this.lowestPillar.imagePath = image;
    }

    /* AVERAGE */
    let avg = pillarValues.reduce((a, b) => a + b.value, 0) / pillarValues.length;
    this.avgScore = Math.round(avg * 100) / 100;
  }

  calculatePillarAvg(id: number): string {
    if (!this.chartTableData?.length) return 'NA';

    let pillarValues = this.chartTableData.flatMap(x => x.pillarValues).filter(x => x.isAccess && x.pillarID == id);

    if (pillarValues.length == 0) return 'NA';
    /* AVERAGE */
    let avg = pillarValues.reduce((a, b) => a + b.value, 0) / pillarValues.length;
    return Math.round(avg * 100) / 100 + '';
  }

   viewVUIAveumCrossComparision(){
    this.chatService.crossComparisionCityIDs.next(this.selectedCities);
    this.router.navigate(['/cityuser/aevum'], { state: { role: UserRole.CityUser } });
  }
}
