import { Component, OnInit, ViewChild } from '@angular/core';
import { GetCityQuestionHistoryReponseDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { CityUserService } from '../../city-user.service';
import { CityDetailsDto, CityPillarDetailsDto } from '../../models/CityDetailsDto';
import { UserDataShareService } from '../../../../core/services/user-data-share.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PillarsTableRow, QuestionTableRow } from 'src/app/core/models/PillarsUserHistoryResponse';
import { MatTableDataSource } from '@angular/material/table';
import { UserCityGetPillarInfoRequstDto } from '../../models/UserCityGetPillarInfoRequstDto';
import { CityPillarQuestionDetailsDto } from '../../models/CityPillarQuestionDetailsDto';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ChartComponent,
  ApexTooltip
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;

};

@Component({
  selector: 'app-city-details',
  templateUrl: './city-details.component.html',
  styleUrl: './city-details.component.css'
})
export class CityDetailsComponent implements OnInit {

  cityDetail: CityDetailsDto | null = null;
  city: CityVM | null = null;
  selectedYear = new Date().getFullYear();
  currentYear = new Date().getFullYear();
  urlBase = environment.apiUrl;
  cityQuestionHistoryReponse: GetCityQuestionHistoryReponseDto | null = null;
  isLoader: boolean = false;
  resizeTimeout: any;
  dataSource = new MatTableDataSource<CityPillarDetailsDto>([]);
  displayedColumns: string[] = ["pillarName", "totalScore", "scoreProgress", "totalAnsPillar", "ansQuestion", "highLowerScore", "totalUnKnown", "totalNA"];

  // dynamic user columns
  userMap = new Map<number, string>(); // userID -> fullName
  expandedElement: PillarsTableRow | null = null;
  questionsPillars = new MatTableDataSource<CityPillarQuestionDetailsDto>([]);
  displayedQuestionColumns: string[] = ["questionText", "totalScore", "scoreProgress", "ansQuestion", "highLowerScore", "totalUnKnown", "totalNA"];

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  constructor(private cityUserService: CityUserService, private toaster: ToasterService, private userService: UserService,
    public commonService: CommonService, private userDataService: UserDataShareService, private router: Router) { }

  ngOnInit(): void {
    this.city = this.userDataService.city();
    if (this.city) {
      this.getCityDetails();
    }
    else {
      this.router.navigate(['cityuser/city-view']);
    }
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }
  getCityDetails() {
    this.isLoader = true;
    let request: UserCityRequstDto = {
      userID: this.userService?.userInfo?.userID ?? 0,
      cityID: this.city?.cityID ?? 0,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    }
    this.cityUserService.getCityDetails(request).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded) {
          this.cityDetail = res.result;
          if (this.cityDetail?.pillars) {
            this.GetApexPillarRadialBarOptions(this.cityDetail.pillars)
            this.setPillarDataSource();
          }
        }
        else {
          this.isLoader = false;
          this.toaster.showError(this.toaster.tryAgain);
        }
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError(this.toaster.tryLater)
      }
    });
  }
  getCityPillarDetails(pillarID: number) {
    let request: UserCityGetPillarInfoRequstDto = {
      userID: this.userService?.userInfo?.userID ?? 0,
      cityID: this.city?.cityID ?? 0,
      pillarID: pillarID,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    }
    this.cityUserService.getCityPillarDetails(request).subscribe({
      next: (res) => {
        if (res.succeeded) {
          if (res.result) {
            this.questionsPillars = new MatTableDataSource<CityPillarQuestionDetailsDto>(res.result);
          }
        }
        else {
          this.toaster.showError(this.toaster.tryAgain);
        }
      },
      error: () => this.toaster.showError(this.toaster.tryLater)
    });
  }

  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement) {
      this.getCityPillarDetails(element.pillarID);
    }
  }

  setPillarDataSource() {
    if (this.cityDetail?.pillars) {
      this.dataSource = new MatTableDataSource<CityPillarDetailsDto>(this.cityDetail?.pillars);
    }
  }

  GetApexPillarRadialBarOptions(history: CityPillarDetailsDto[]) {
    const colors = this.commonService.PillarColors;
    const filterData = history.filter(x => x.isAccess).sort((x: any, y: any) => y.scoreProgress - x.scoreProgress);
    // Convert to Apex series + labels format
    const series = filterData.map(h =>
      h.scoreProgress === 0 ? 5.03 : Number(h.scoreProgress.toFixed(1))
    );

    const labels = filterData.map(h => h.pillarName);

    this.chartOptions = {
      series: series,

      chart: {
        height: 380,
        type: "radialBar",
        toolbar: { show: false }
      },

      colors: colors,

      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 300,
          offsetY: 20,
          offsetX: 5,

          hollow: {
            size: "40%",
            background: "#25453f0d"
          },

          track: {
            background: "#f1f1f1",
            strokeWidth: "100%",
          },

          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              offsetY: -10,
            },
            value: {
              show: true,
              offsetY: 10,
              formatter: (opts: number) => {
                return `${opts}%`;
              }
            },
            total: {
              show: true,
              label: "Avg Pillar Score",
              formatter: () => {
                const avg =
                  history.reduce((sum, item) => sum + item.scoreProgress, 0) /
                  history.length;
                return `${avg.toFixed(1)}%`;
              }
            }
          }
        }
      },
      labels: labels,
    };
  }
}
