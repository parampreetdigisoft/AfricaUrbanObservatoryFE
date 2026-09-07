import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { AnalystService } from '../../analyst.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { DownloadReportDto } from 'src/app/core/models/aiVm/downloadReportDto';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { DocumentFormat } from 'src/app/core/enums/DocumentFormat';

@Component({
  selector: 'app-assigned-city',
  templateUrl: './assigned-city.component.html',
  styleUrl: './assigned-city.component.css'
})
export class AssignedCityComponent implements OnInit, OnDestroy {
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  isLoader: boolean = false;
  selectedCities: CityVM[] = [];
  isExporting: boolean = false;

  // Track selected IDs in a Set for O(1) lookup
  private selectedCityIds = new Set<number>();

  constructor(
    private analystService: AnalystService,
    private userService: UserService,
    private toaster: ToasterService,
    private aiComputationService: AiComputationService
  ) {}

  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.getCities();
  }

  // ─── Computed: are ALL cities on current page selected? ───────────────────
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

  // ─── Fetch page ────────────────────────────────────────────────────────────
  getCities(currentPage: number = 1) {
    this.citiesResponse = undefined;
    this.isLoader = true;

    const payload: PaginationUserRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'score',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID
    };

    this.analystService.getCities(payload).subscribe(cities => {
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;

      // ✅ Restore selection state for cities on this page
      cities.data.forEach(city => {
        city.selected = this.selectedCityIds.has(city.cityID);
      });

      this.citiesResponse = cities;
    });
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

  // aiAllCityDetailsReport(format: string = 'pdf') {

  //   if (!this.selectedCities.length) {
  //     this.toaster.showWarning('Please select at least one city');
  //     return;
  //   }

  //   this.isExporting = true;

  //   const payload: DownloadReportDto = {
  //     cityIDs: this.selectedCities.map(x => x.cityID),
  //     format: format
  //   };

  //   this.aiComputationService.aiAllCityDetailsReport(payload).subscribe({
  //     next: (blob) => {
  //       this.isExporting = false;
  //       if (blob.size > 0) {
  //         const ext = format == DocumentFormat.Pdf ? 'pdf' : 'docx';

  //         const url = window.URL.createObjectURL(blob);
  //         const link = document.createElement('a');
  //         link.href = url;
  //         link.download = `All_Cities_Details_${new Date().toISOString().split('T')[0]}..${ext}`;
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);
  //         window.URL.revokeObjectURL(url);
  //         this.toaster.showSuccess('Report generated successfully');
  //       } else {
  //         this.toaster.showWarning(
  //           'No data available for the selected city or the PDF could not be generated.'
  //         );
  //       }
  //     },
  //     error: () => {
  //       this.toaster.showError('There is an error occured, please try again');
  //       this.isExporting = false;
  //     }
  //   });
  // }
}