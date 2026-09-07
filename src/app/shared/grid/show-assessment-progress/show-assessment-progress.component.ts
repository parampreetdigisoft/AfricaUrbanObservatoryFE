import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { AgChartOptions } from "ag-charts-community";
import { AssessmentWithProgressVM } from "src/app/core/models/AssessmentResponse";
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
  ApexStroke
} from "ng-apexcharts";
import { Router } from "@angular/router";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: "app-show-assessment-progress",
  templateUrl: "./show-assessment-progress.component.html",
  styleUrl: "./show-assessment-progress.component.css",
})
export class ShowAssessmentProgressComponent implements OnInit, OnChanges, OnDestroy {

  @Input() assessmentProgress: AssessmentWithProgressVM | null = null;
  options: AgChartOptions = {};
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  isShow: boolean = true;

  constructor(private router: Router) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.isShow = true;
    if (this.router.url.includes('assessment')) {
      this.getoptions();
    }else{
      this.isShow= false;
    }
  }
  ngOnDestroy(): void {
    this.chartOptions = {};
  }

  ngOnInit(): void { }

  getoptions() {
    this.chartOptions = {
      series: [this.assessmentProgress?.currentProgress ?? 0],
      chart: {
        height: 180,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          offsetX: 5,
          offsetY: 5,
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 2,
            size: "80%",
            background: "#12352f",
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
            background: "#ffffff",
            strokeWidth: "50%",
            margin: 3, // margin is in pixels
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
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            value: {
              formatter: function (val) {
                return val.toString() + "%";
              },
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: 600,
              fontFamily: "Poppins",
              show: true
            }
          }
        }
      },
      fill: {
        type: "solid",               // ❗ Use solid color (no gradient)
        colors: ["#FFD700"]          // 🌟 PURE YELLOW (Gold)
      },
      stroke: {
        lineCap: "round"
      },
      labels: ["Compeleted"]
    };
  }
}
