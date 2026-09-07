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

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-view-kpi-layer',
  templateUrl: './view-kpi-layer.component.html',
  styleUrl: './view-kpi-layer.component.css'
})
export class ViewKpiLayerComponent implements OnInit, OnChanges {

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


  getCalculatedValues() {
    const value = this.selectedLayer?.calValue5 ?? 0;
    const aiValue = this.selectedLayer?.aiCalValue5 ?? 0;

    const round = (val: number) =>
      Math.round((val + Number.EPSILON) * 100) / 100;

    return {
      manual: round(value),
      ai: round(aiValue)
    };
  }
  ApexGetPieOptions() {
    const { manual, ai } = this.getCalculatedValues();

    this.chartOptions = {
      series: [manual, ai],
      chart: {
        height: 360,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            size: "55%"
          },
          track: {
            background: "#f2f2f2",
            strokeWidth: "100%"
          },
          dataLabels: {
            show: true,
            name: {
              fontSize: "14px",
              color: "#666"
            },
            value: {
              fontSize: "22px",
              fontWeight: 600,
              color: "#111",
              formatter: (val: number) => `${val}`
            },
            total: {
              show: true,
              label: "Manual vs AI",
              formatter: () => `${manual}/ ${ai}`
            }
          }
        }
      },
      fill: {
        type: "solid",
        colors: ["#304a43", "#d1eae1"] // Manual, AI
      },
      stroke: {
        lineCap: "round"
      },
      labels: ["Manual Score", "AI Score"]
    };
  }
}
