import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { BulkAddCityDto, CityVM } from '../../../../core/models/CityVM';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { environment } from 'src/environments/environment';
import { DownloadReportDto } from 'src/app/core/models/aiVm/downloadReportDto';
import { AiComputationService } from 'src/app/core/services/ai-computation.service';
import { ExportCityWithOptionDto } from 'src/app/core/models/ExportCityWithOptionDto';
import { DocumentFormat } from 'src/app/core/enums/DocumentFormat';
declare var bootstrap: any;
@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrl: './city.component.css'
})
export class CityComponent implements OnInit, OnDestroy {
  urlBase = environment.apiUrl;
  selectedCity: CityVM | null | undefined = null;
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  isLoader: boolean = false;
  isOpendialog = false;
  isExporting: boolean = false;
  cities: CityVM[] = [];
  selectedCities: CityVM[] = [];
  isReportExporting: boolean = false;
  private selectedCityIds = new Set<number>();

  constructor(private adminService: AdminService, private toaster: ToasterService,
    private userService: UserService, private aiComputationService: AiComputationService) { }

  ngOnInit(): void {
    this.getCities(1);
    this.getAllCitiesByUserId();
  }

  getCities(currentPage: number = 1) {
    this.citiesResponse = undefined;
    this.isLoader = true;
    let payload: PaginationUserRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'score',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID
    }

    this.adminService.getCities(payload).subscribe(cities => {
      // ✅ Restore selection state for cities on this page
      cities.data.forEach(city => {
        city.selected = this.selectedCityIds.has(city.cityID);
      });
      this.citiesResponse = cities;

      this.citiesResponse = cities;
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;
    });

  }

  editCity(city: CityVM | null) {
    this.selectedCity = city;
  }
  deleteCity() {
    if (this.selectedCity === null) {
      this.toaster.showError('No city selected for deletion');
      return;
    }
    this.adminService.deleteCity(this.selectedCity?.cityID ?? 0).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getCities(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.toaster.showError('Failed to delete city');
      }
    });
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
  addUpdateCity(formData: FormData) {
    this.loading = true;
    this.adminService.AddUpdateCity(formData).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getCities(this.currentPage);
          this.toaster.showSuccess(res?.messages?.join(', '));
        } else {
          this.toaster.showError(res?.errors?.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to edit city');
      }
    });
  }
  getAllCitiesByUserId() {
    this.adminService
      .getAllCitiesByUserId(this.userService?.userInfo?.userID)
      .subscribe({
        next: (res) => {
          this.cities = res.result || [];
          if (this.cities) {
            //this.selectedcityID = this.cities?.length > 0 ? this.cities[0].cityID : null
          } else {
            this.toaster.showWarning("No city assigned");
          }
        },
      });
  }

  opendialog() {
    this.isOpendialog = true;
    setTimeout(() => {
      const modalEl = document.getElementById("exampleModal");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show(); // ✅ use show()
      }
    }, 100);
  }
  closeModal() {
    this.loading = false;
    const homeTab = document.querySelector('#pills-home-tab') as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById('exampleModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance)
      modalInstance.hide();
    this.isOpendialog = false;
  }
  openCityModal(city: CityVM | null) {
    this.selectedCity = city ?? null;
    this.opendialog();
  }
  ngOnDestroy(): void {

  }
  bulkImport(city: CityVM[]) {
    this.loading = true;
    let payload: BulkAddCityDto = {
      cities: city
    }
    this.adminService.addBulkCity(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getCities(1);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to add cities');
      }
    });
  }

  exportCities(isAllCity?: boolean, isRanking?: boolean, isPillarLevel?: boolean) {

    this.isExporting = true;
    let payload: ExportCityWithOptionDto = {
      isAllCity: isAllCity,
      isRanking: isRanking,
      isPillarLevel: isPillarLevel
    }
    if (this.selectedCities.length && !isAllCity) {
      payload.cityIDs = this.selectedCities.map(x => x.cityID);
    }


    this.adminService.exportCities(payload).subscribe({
      next: (res) => {
        this.isExporting = false;
        const formattedDate = new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');

        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Cities_Progress_${formattedDate}.xlsx`;
        a.click();
        this.toaster.showSuccess("Pillars History downloaded successfully");
      },
      error: () => {
        this.isExporting = false;
        this.toaster.showError('Failed to download cities');
      }
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

  aiAllCityDetailsReport(format: string = 'pdf') {

    if (!this.selectedCities.length) {
      this.toaster.showWarning('Please select at least one city');
      return;
    }

    this.isReportExporting = true;

    const payload: DownloadReportDto = {
      cityIDs: this.selectedCities.map(x => x.cityID),
      format: format
    };

    this.aiComputationService.aiAllCityDetailsReport(payload).subscribe({
      next: (blob) => {
        this.isReportExporting = false;
        if (blob.size > 0) {
          const ext = format == DocumentFormat.Pdf ? 'pdf' : 'docx';

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `All_Cities_Details_${new Date().toISOString().split('T')[0]}.${ext}`;
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
        this.isReportExporting = false;
      }
    });
  }

}
