import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { GetAnalyticalLayerResultDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { environment } from 'src/environments/environment';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
  ApexStroke
} from "ng-apexcharts";
import { SharedModule } from 'src/app/shared/share.module';
import { CommonModule } from '@angular/common';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-view-city-user-kpi-layer',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './view-city-user-kpi-layer.component.html',
  styleUrl: './view-city-user-kpi-layer.component.css'
})
export class ViewCityUserKpiLayerComponent implements OnInit, OnChanges {

  @Input() selectedLayer?: GetAnalyticalLayerResultDto | null = null;
  urlBase = environment.apiUrl;
  get city() {
    return this.selectedLayer?.city;
  }
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;


  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void {
    this.ApexGetPieOptions();
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  getConditionByid() {
    let condition = this.selectedLayer?.fiveLevelInterpretations?.find(x => x.interpretationID == this.selectedLayer?.interpretationID)?.condition ?? 'NA';
    condition = condition.split(' ')[0];
    return condition;
  }
  getAiConditionByid() {
    let condition = this.selectedLayer?.fiveLevelInterpretations?.find(x => x.interpretationID == this.selectedLayer?.aiInterpretationID)?.condition ?? 'NA';
    condition = condition.split(' ')[0];
    return condition;
  }
  get interpretaions() {
    return this.selectedLayer?.fiveLevelInterpretations;
  }

  getCalculatedValue() {
    const value = this.selectedLayer?.calValue5;
    const aiValue = this.selectedLayer?.aiCalValue5;

    // Return the value rounded to 2 decimal places but keep it as number
    return value !== undefined && value !== null
      ? Math.round((value + Number.EPSILON) * 100) / 100
      : value ?? 0;
  }

  get getAiCalculatedValue() {
    const aiValue = this.selectedLayer?.aiCalValue5 == 100 || this.selectedLayer?.aiCalValue5 == 0 ? this.selectedLayer?.aiCalValue5?.toFixed(0) : this.selectedLayer?.aiCalValue5?.toFixed(2);
    return aiValue !== undefined && aiValue !== null ? aiValue : '0';
  }
  get getEvaluationCalculatedValue() {
    const aiValue = this.selectedLayer?.calValue5 == 100 || this.selectedLayer?.calValue5 == 0 ? this.selectedLayer?.calValue5?.toFixed(0) : this.selectedLayer?.calValue5?.toFixed(2);
    return aiValue !== undefined && aiValue !== null ? aiValue : '0';
  }


  private getScoreColor(score: number): string {
    if (score >= 75) return "#575c59";   // Green – strong
    if (score >= 50) return "#f59e0b";   // Amber – moderate
    return "#dc2626";                    // Red – weak
  }

  ApexGetPieOptions() {
    const round = (val: number) =>
      Math.round((val + Number.EPSILON) * 100) / 100;

    const aiValue = this.selectedLayer?.aiCalValue5 ?? 0;
    const value = round(aiValue);
    const scoreColor = this.getScoreColor(value);

    this.chartOptions = {
      series: [value],
      chart: {
        height: 360,
        type: "radialBar",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 900
        },
        toolbar: { show: false }
      },

      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 0,
            size: "70%",
            background: "#fff",
            image: undefined,
            position: "front",
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#fff",
            strokeWidth: "67%",
            margin: 0, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: -10,
              show: true,
              color: "#888",
              fontSize: "17px"
            },
            value: {
              formatter: function (val) {
                return val.toString() + '%';
              },
              color: "#111",
              fontSize: "36px",
              show: true
            }
          }
        }
      },
      fill: {
        type: "solid",
        colors: ["#efbf04"]
      },
      stroke: {
        lineCap: "round"
      },
      labels: ["Performance"]
    };
  }

}

