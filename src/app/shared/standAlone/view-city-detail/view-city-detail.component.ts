import { Component, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AiCitySummeryDto } from 'src/app/core/models/aiVm/AiCitySummeryDto';
import { environment } from 'src/environments/environment';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ChartComponent,
  ApexLegend
} from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { TypingTextComponent } from 'src/app/shared/standAlone/typing-text/typing-text.component';
import { SharedModule } from 'src/app/shared/share.module';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from 'src/app/core/services/user.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;

};

@Component({
  selector: 'app-view-city-detail',
  standalone: true,
  imports: [CommonModule, TypingTextComponent, SharedModule, CircularScoreComponent, SparklineScoreComponent,MatTooltipModule],
  templateUrl: './view-city-detail.component.html',
  styleUrl: './view-city-detail.component.css'
})
export class ViewCityDetailComponent implements OnChanges {
  @Input() city?: AiCitySummeryDto | null = null;
  @Output() closeSidebar?: boolean | null = null;
  urlBase = environment.apiUrl;
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  router = inject(Router);
  userService = inject(UserService);

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ApexGetPieOptions();
  }

  viewPillars() {
    this.router.navigate([`/${this.userService.userInfo?.role?.toLowerCase()}/ai/kpi-analysis`], {
      queryParams: {
        cityID: this.city?.cityID,
        year:this.city?.scoringYear
      }
    });
  }

  ApexGetPieOptions() {
    const aiProgress = this.city?.aiProgress ?? 0;
    const evaluatorProgress = this.city?.evaluatorProgress ?? 0;
    const discrepancy = this.city?.discrepancy ?? 0;
    const avgProgress = (aiProgress + evaluatorProgress) / 2;

    this.chartOptions = {
      series: [
        aiProgress,
        evaluatorProgress,
        discrepancy,
        avgProgress
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
          offsetY: 80,
          offsetX: 20,
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
                const v = Number(value);
                return isNaN(v) ? '0.00' : v.toFixed(2);
              }
            },
            total: {
              show: true,
              label: "Avg Progress",
              formatter: (value: any) => {
                return `${avgProgress.toFixed(2)}`;
              },
            }
          }
        }
      },
      colors: ["#51eea5", "#486363", "#383836d9", "#099176"],
      labels: ["AI Progress", "Evaluator Progress", "Discrepancy", "Avg Progress"],
      legend: {
        show: true,
        floating: true,
        fontSize: "16px",
        position: "left",
        offsetX: 10,
        offsetY: -10,
        labels: {
          useSeriesColors: true
        },
        formatter: function (seriesName: any, opts: any) {
          return seriesName + ":  " + `${((opts.w.globals.series[opts.seriesIndex])).toFixed(2)}`;
        },
        itemMargin: {
          horizontal: 3
        }
      }

    };
  }
}
