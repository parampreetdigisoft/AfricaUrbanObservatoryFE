import { Component } from "@angular/core";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { CityVM } from "src/app/core/models/CityVM";
import { GetAnalyticalLayerResultDto, AnalyticalLayerResponseDto, GetAnalyticalLayerRequestDto } from "src/app/core/models/GetAnalyticalLayerResultDto";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
import { AnalystService } from "../../analyst.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { CircularScoreComponent } from "src/app/shared/standAlone/circular-score/circular-score.component";
import { SparklineScoreComponent } from "src/app/shared/standAlone/sparkline-score/sparkline-score.component";
import { debounceTime, Subject } from "rxjs";
import { CommonService } from "src/app/core/services/common.service";

declare var bootstrap: any; // 👈 use Bootstrap JS API
@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, SparklineScoreComponent, CircularScoreComponent],
  selector: 'app-kpi-layers',
  templateUrl: './kpi-layers.component.html',
  styleUrl: './kpi-layers.component.css'
})
export class KpiLayersComponent {
  selectedYear = new Date().getFullYear();
  urlBase = environment.apiUrl;
  selectedKpi: GetAnalyticalLayerResultDto | null | undefined = null;
  selectedCityID?: number;
  selectedkpiLayerID?: number;
  kpiLayersResponse: PaginationResponse<GetAnalyticalLayerResultDto> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  isLoader: boolean = false;
  kpis: AnalyticalLayerResponseDto[] = [];
  cityList: CityVM[] = [];
  $kpiChanged = new Subject();
  kpiLayers: GetAnalyticalLayerResultDto[] = [];
  constructor(private analystService: AnalystService, private toaster: ToasterService, private userService: UserService, public commonService:CommonService) { }

  ngOnInit(): void {
    this.GetAnalyticalLayerResults(1);
    this.getCityUserCities();
    this.GetAllKpi();
    this.$kpiChanged.pipe(debounceTime(1000)).subscribe(x => {
      this.GetAnalyticalLayerResults();
    });
  }
  kpiChanged() {
    this.$kpiChanged.next(true);
  }

  GetAnalyticalLayerResults(currentPage: any = 1) {
    this.kpiLayersResponse = undefined;
    this.isLoader = true;
    let payload: GetAnalyticalLayerRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: 'CalValue4',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID
    }
    if (this.selectedCityID != undefined && this.selectedCityID != 0) {
      payload.cityID = this.selectedCityID
    }
    if (this.selectedkpiLayerID != undefined && this.selectedkpiLayerID != 0) {
      payload.layerID = this.selectedkpiLayerID
    }
    if(this.selectedYear > 0){
      payload.year = Number(this.selectedYear);
    }
    this.analystService.GetAnalyticalLayerResults(payload).subscribe(kpiLayers => {
      this.kpiLayersResponse = kpiLayers;
      this.totalRecords = kpiLayers.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = kpiLayers.pageSize;
      this.isLoader = false;
    });
  }

  ngOnDestroy(): void {

  }

  viewDetails(city: GetAnalyticalLayerResultDto) {
    this.selectedKpi = city;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    offcanvas.show();
  }
  GetAllKpi() {
    this.analystService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
        }
      }
    });
  }
  getCityUserCities() {
    this.analystService.getAllCitiesByUserId(this.userService.userInfo.userID ?? 0).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.cityList = res.result ?? [];
        }
      }
    });
  }

  getConditionByid(layer: GetAnalyticalLayerResultDto) {
    return layer?.fiveLevelInterpretations?.find(x => x.interpretationID == layer.interpretationID)?.condition || '';
  }
  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
}
