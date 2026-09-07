import { Component, OnInit } from "@angular/core";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { CityVM } from "src/app/core/models/CityVM";
import { CommonService } from "src/app/core/services/common.service";
import { GetCityPillarHistoryRequestDto, GetCityPillarHistoryRequestNewDto } from "src/app/core/models/AssessmentRequest";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { MatTableDataSource } from "@angular/material/table";
import {
  PillarsHistoryResponse,
  PillarsTableRow,
  QuestionTableRow,
} from "src/app/core/models/PillarsUserHistoryResponse";
import { QuestionsByUserPillarsResponsetDto } from "src/app/core/models/GetQuestionHistoryResponseDto ";
import { AnalystService } from "../../analyst.service";
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexLegend, ApexPlotOptions, ApexGrid, ApexStroke } from "ng-apexcharts";
import { DocumentFormat } from "src/app/core/enums/DocumentFormat";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: "app-comparision",
  templateUrl: "./comparision.component.html",
  styleUrl: "./comparision.component.css",
})

export class ComparisionComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  pillers: PillarsVM[] = [];
  pillersHistory: PillarsHistoryResponse[] = [];
  questionsByUserPillars: QuestionsByUserPillarsResponsetDto[] = [];
  cities: CityVM[] | null = [];
  selectedCities: number | any = "";
  selectedPillarID: number | any = "";
  isLoader: boolean = false;
  isPillarHistroyDownloading: boolean = false;
  dataSource = new MatTableDataSource<PillarsTableRow>([]);
  displayedColumns: string[] = []; // pillarName + dynamic users
  userMap = new Map<number, string>(); // userID -> fullName
  expandedElement: PillarsTableRow | null = null;
  questionsPillars = new MatTableDataSource<QuestionTableRow>([]);
  displayedQuestionColumns: string[] = []; // pillarName + dynamic users
  chartOptions!: Partial<ChartOptions>;
  pageSize: number = 28;
  currentPage: number = 1;
  totalRecords: number = 0;
  // Columns for mat-table
  pillarColumns: string[] = []; // dynamic user columns

  constructor(
    private analystService: AnalystService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllPillars();
    this.getAllCitiesByUserId();
    this.initializeChart();
  }
  GetAllPillars() {
    this.analystService.getAllPillars().subscribe((p) => {
      this.pillers = p;
    });
  }
  getAllCitiesByUserId() {
    this.analystService
      .getAllCitiesByUserId(this.userService?.userInfo?.userID)
      .subscribe({
        next: (res) => {
          setTimeout(() => {
            this.isLoader = false;
          }, 1000);

          this.cities = res.result;
          if (this.cities && this.cities.length > 0) {
            this.selectedCities = this.cities[0].cityID;
            this.getResponsesByUserId();
          }
        },
        error: () => {
          this.isLoader = false;
        }
      });
  }

  getResponsesByUserId() {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedCities ||
      this.selectedCities === "" ||
      this.selectedCities == null
    ) {
      return;
    }

    this.isLoader = true;
    let payload: GetCityPillarHistoryRequestNewDto = {
      userId: this.userService?.userInfo?.userID,
      pillarID:
        this.selectedPillarID && this.selectedPillarID > 0
          ? this.selectedPillarID
          : null,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };
    this.questionsByUserPillars = [];
    this.loadPillarQuestion();
    this.analystService.getResponsesByUserId(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.pillersHistory = res.data ?? [];
        this.loadPillars();
        this.totalRecords = res.totalRecords
        this.GetPillarBarOptions();
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("There is an error occur");
      }
    });
  }

  compareCities(event: any) {
    this.currentPage = event;
    this.getResponsesByUserId();
  }
  GetPillarBarOptions() {
    // Group data by pillar and evaluator
    // Map structure
    const pillarMap = new Map<number, {
      pillarName: string;
      evaluators: Map<string, {
        score: number;
        ansQuestion: number;
        totalQuestion: number;
      }>;
    }>();

    this.pillersHistory.forEach((item: PillarsHistoryResponse) => {

      // Initialize pillar if not exists
      if (!pillarMap.has(item.pillarID)) {
        pillarMap.set(item.pillarID, {
          pillarName: item.pillarName,
          evaluators: new Map()
        });
      }

      const pillarEntry = pillarMap.get(item.pillarID)!;

      // Add evaluators
      item.users.forEach(user => {
        pillarEntry.evaluators.set(user.fullName, {
          score: user.scoreProgress,
          ansQuestion: user.ansQuestion,
          totalQuestion: user.totalQuestion
        });
      });
    });

    // Get unique evaluators
    const uniqueEvaluators = Array.from(
      new Set(this.pillersHistory.flatMap(x => x.users).map(x => x.fullName))
    );

    // Prepare series data (one series per evaluator)
    const series: ApexAxisChartSeries = uniqueEvaluators.map(evaluator => ({
      name: evaluator,
      data: Array.from(pillarMap.values()).map(pillar => {
        const evaluatorData = pillar.evaluators.get(evaluator);
        return evaluatorData ? evaluatorData.score : 0;
      })
    }));

    // Prepare categories (pillar names)
    const categories = Array.from(pillarMap.values()).map(p => p.pillarName);

    // Store full data for tooltip
    const tooltipData = Array.from(pillarMap.entries()).map(([pillarID, pillar]) => ({
      pillarName: pillar.pillarName,
      evaluators: Object.fromEntries(pillar.evaluators)
    }));

    // Calculate dynamic column width and bar width based on number of pillars
    const pillarCount = categories.length;
    let barMaxWidth: number | undefined = 120;
    // Base width calculation
    let columnWidthPercent = 70;
    const totalBars = pillarCount * series.length
    // Reduce width aggressively when data is small
    if (totalBars == 1) {
      columnWidthPercent = 5;
      barMaxWidth = 50;
    } else if (totalBars == 2) {
      columnWidthPercent = 10;
    } else if (totalBars <= 3) {
      columnWidthPercent = 15;
    } else if (totalBars <= 4) {
      columnWidthPercent = 20;
      barMaxWidth = 100;
    } else if (totalBars <= 6) {
      columnWidthPercent = 30;
    } else if (totalBars <= 10) {
      columnWidthPercent = 45;
    } else {
      columnWidthPercent = 60;
      barMaxWidth = 120; // Max 80px wide per bar
    }

    this.chartOptions = {
      series: series,
      chart: {
        type: 'bar',
        height: 500,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        fontFamily: 'Inter, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: `${columnWidthPercent}%`,
          ...(barMaxWidth && { barHeight: barMaxWidth }), // Apply max width if defined
          borderRadius: 6,
          borderRadiusApplication: 'end',
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return '';
        },
        offsetY: -20,
        style: {
          fontSize: '11px',
          fontWeight: 600,
          colors: ['#304758']
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#64748b'
          },
          rotate: pillarCount > 8 ? -45 : 0, // Only rotate if many pillars
          rotateAlways: false,
          trim: true,
          maxHeight: 120
        },
        title: {
          text: 'Pillars',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#475569'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Score',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#475569'
          }
        },
        labels: {
          formatter: function (val: number) {
            return val.toFixed(0) + '';
          },
          style: {
            fontSize: '12px',
            colors: '#64748b'
          }
        },
        min: 0,
        max: 100
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (val: number, opts) {
            const seriesIndex = opts.seriesIndex;
            const dataPointIndex = opts.dataPointIndex;
            const evaluatorName = uniqueEvaluators[seriesIndex];
            const pillarData = tooltipData[dataPointIndex];
            const evaluatorData = pillarData.evaluators[evaluatorName];

            if (evaluatorData) {
              return `${val.toFixed(1)} (${evaluatorData.ansQuestion}/${evaluatorData.totalQuestion} questions)`;
            }
            return val.toFixed(1) + '';
          }
        },
        style: {
          fontSize: '13px'
        },
        theme: 'light'
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        offsetY: 0,
        fontSize: '13px',
        fontWeight: 500,
        markers: {
          width: 12,
          height: 12,
          radius: 3
        },
        itemMargin: {
          horizontal: 12,
          vertical: 8
        }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 10
        }
      },
      colors: this.commonService.PillarColors.slice(0, uniqueEvaluators.length)
    };
  }
  private initializeChart() {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 500
      },
      xaxis: {
        categories: []
      }
    };
  }

  loadPillars() {
    this.userMap = new Map<number, string>();
    this.pillersHistory.forEach((pillar) => {
      pillar.users.forEach((u) => this.userMap.set(u.userID, u.fullName));
    });

    // Use userID as column keys
    this.pillarColumns = Array.from(this.userMap.keys()).map((id) =>
      id.toString()
    );
    this.displayedColumns = ["pillarName", ...this.pillarColumns];

    let data = this.pillersHistory.map((pillar) => {
      const row: PillarsTableRow = {
        pillarName: pillar.pillarName,
        pillarID: pillar.pillarID,
      };

      // Fill all users with default "0"
      this.userMap.forEach((_, userID) => {
        row[userID] = "0";
      });

      // Overwrite existing users with their score
      pillar.users.forEach((u) => {
        row[u.userID] = u.score;
      });

      return row;
    });
    this.dataSource = new MatTableDataSource<PillarsTableRow>(data);
  }

  loadPillarQuestion() {
    const data = this.questionsByUserPillars.map((question) => {
      const row: QuestionTableRow = {
        question: question.questionText,
      };
      // Fill all users with default values
      this.userMap.forEach((userID) => {
        row[userID] = {
          score: null,
          justification: null,
          optionText: null,
        };
      });

      // Overwrite only existing users
      question.users.forEach((u) => {
        row[u.userID] = {
          score: u.score,
          justification: u.justification,
          optionText: u.optionText,
        };
      });
      return row;
    });

    this.displayedQuestionColumns = ["question", ...this.pillarColumns]; // final columns for table

    this.questionsPillars = new MatTableDataSource<QuestionTableRow>(data);
  }

  getQuestionsHistoryByPillar(pillarID: number) {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedCities ||
      this.selectedCities === "" ||
      this.selectedCities == null
    ) {
      return;
    }

    let payload: GetCityPillarHistoryRequestDto = {
      userID: this.userService?.userInfo?.userID,
      pillarID: pillarID,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
      exportType:DocumentFormat.Xlsx
    };
    this.questionsByUserPillars = [];
    this.loadPillarQuestion();
    this.analystService.getQuestionsHistoryByPillar(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.questionsByUserPillars = res.result ?? [];
          this.loadPillarQuestion();
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("There is an error please try later");
      },
    });
  }

  exportPillarsHistoryByUserId() {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedCities ||
      this.selectedCities === "" ||
      this.selectedCities == null || this.pillarColumns?.length == 0
    ) {
      return;
    }
    this.isPillarHistroyDownloading = true;
    let payload: GetCityPillarHistoryRequestDto = {
      userID: this.userService?.userInfo?.userID,
      cityID: this.selectedCities,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
      exportType:DocumentFormat.Xlsx
    };
    if (this.selectedPillarID) {
      payload.pillarID = this.selectedPillarID;
    }
    this.analystService.exportPillarsHistoryByUserId(payload).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PillarQuestionHistory.xlsx";
        a.click();
        this.isPillarHistroyDownloading = false;
        this.toaster.showSuccess("Pillars History downloaded successfully");
      },
      error: () => {
        this.isPillarHistroyDownloading = false;
        this.toaster.showError("There is an error please try later");
      },
    });
  }
  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement) {
      this.getQuestionsHistoryByPillar(element.pillarID);
    }
  }
}
