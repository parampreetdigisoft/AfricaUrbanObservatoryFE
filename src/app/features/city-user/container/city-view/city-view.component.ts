import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { CityVM } from '../../../../core/models/CityVM';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { environment } from 'src/environments/environment';
import { CityUserService } from '../../city-user.service';
import { Router } from '@angular/router';
import { UserDataShareService } from '../../../../core/services/user-data-share.service';
import { TieredAccessPlanValue } from 'src/app/core/enums/TieredAccessPlan';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { DownloadReportDto } from 'src/app/core/models/aiVm/downloadReportDto';
import { DocumentFormat } from 'src/app/core/enums/DocumentFormat';
declare var bootstrap: any;
@Component({
  selector: 'app-city-view',
  templateUrl: './city-view.component.html',
  styleUrl: './city-view.component.css'
})
export class CityViewComponent {
  urlBase = environment.apiUrl;
  selectedCity: CityVM | null | undefined = null;
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  isLoader: boolean = false;
  isOpendialog = false;
  selectedCities: CityVM[] = [];
  cities: CityVM[] = [];
  tier: TieredAccessPlanValue = TieredAccessPlanValue.Pending;
  isExporting: boolean = false;
  private selectedCityIds = new Set<number>();

  constructor(private cityuserService: CityUserService, private toaster: ToasterService,
    private userService: UserService, private router: Router, private userDataService: UserDataShareService, private aiComputationService: AiComputationService) {
    this.tier = this.userService?.userInfo?.tier || 0;
  }

  ngOnInit(): void {
    this.getCities(1);
  }

  getCities(currentPage: any = 1) {
    this.citiesResponse = undefined;
    this.isLoader = true;
    let payload: PaginationUserRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'score',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID
    }

    this.cityuserService.getCities(payload).subscribe(cities => {
      this.citiesResponse = cities;
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;
    });

  }
  get isAllCurrentPageSelected(): boolean {
    const currentData = this.citiesResponse?.data ?? [];
    return (
      currentData.length > 0 &&
      currentData.every(city => this.selectedCityIds.has(city.cityID))
    );
  }

  // ─── Computed: are SOME (but not all) cities on current page selected? ────
  get isSomeCurrentPageSelected(): boolean {
    const currentData = this.citiesResponse?.data ?? [];
    return (
      currentData.some(city => this.selectedCityIds.has(city.cityID)) &&
      !this.isAllCurrentPageSelected
    );
  }


  ngOnDestroy(): void {

  }

  viewDetails(city: CityVM) {
    this.userDataService.city.set(city);
    this.router.navigate(['cityuser/city-details']);
  }

  // ─── Select / Deselect ALL on current page ────────────────────────────────
  AllCitySelected(event: any) {
    const isChecked = event.target.checked;
    const currentData = this.citiesResponse?.data ?? [];

    if (isChecked) {
      currentData.forEach(city => {
        city.selected = true;
        if (!this.selectedCityIds.has(city.cityID)) {
          this.selectedCityIds.add(city.cityID);
          this.selectedCities.push(city);
        }
      });
    } else {
      currentData.forEach(city => {
        city.selected = false;
        this.selectedCityIds.delete(city.cityID);
      });
      const currentIds = new Set(currentData.map(c => c.cityID));
      this.selectedCities = this.selectedCities.filter(
        c => !currentIds.has(c.cityID)
      );
    }
  }

  CitySelected(event: any, city: CityVM) {
    const isChecked = event.target.checked;
    city.selected = isChecked;

    if (isChecked) {
      if (!this.selectedCityIds.has(city.cityID)) {
        this.selectedCityIds.add(city.cityID);
        this.selectedCities.push(city);
      }
    } else {
      this.selectedCityIds.delete(city.cityID);
      this.selectedCities = this.selectedCities.filter(
        c => c.cityID !== city.cityID
      );
    }
  }

  isCitySelected(city: CityVM): boolean {
    return this.selectedCities.some(x => x.cityID === city.cityID);
  }
  gotoComparision() {
    this.userDataService.compareCity.set(this.selectedCities);
    this.router.navigate(['/cityuser/comparision']);
  }

  aiAllCityDetailsReport(format: string = 'pdf') {
  
      if (!this.selectedCities.length) {
        this.toaster.showWarning('Please select at least one city');
        return;
      }
  
      this.isExporting = true;
  
      const payload: DownloadReportDto = {
        cityIDs: this.selectedCities.map(x => x.cityID),
        format: format
      };
  
      this.aiComputationService.aiAllCityDetailsReport(payload).subscribe({
        next: (blob) => {
          this.isExporting = false;
          if (blob.size > 0) {
            const ext = format == DocumentFormat.Pdf ? 'pdf' : 'docx';
  
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `All_Cities_Details_${new Date().toISOString().split('T')[0]}..${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.toaster.showSuccess('Report generated successfully');
          } else {
            this.toaster.showWarning(
              'No data available for the selected city or the PDF could not be generated.'
            );
          }
        },
        error: () => {
          this.toaster.showError('There is an error occured, please try again');
          this.isExporting = false;
        }
      });
    }

}
