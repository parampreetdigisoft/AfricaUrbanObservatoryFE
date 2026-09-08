import { Component, OnDestroy, OnInit } from "@angular/core";
import { AdminService } from "../../admin.service";
import { CityVM } from "../../../../core/models/CityVM";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import {
  GetUserByRoleRequestDto,
  GetUserByRoleResponse,
} from "../../../../core/models/GetUserByRoleResponse";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import {
  InviteBulkUserDto,
  UpdateInviteUserDto,
} from "../../../../core/models/AnalystVM";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { ActivatedRoute } from "@angular/router";
import { PillarsVM } from "src/app/core/models/PillersVM";
declare var bootstrap: any;

interface CityUserRow extends GetUserByRoleResponse {
  citiesText?: string;
  citiesExpand?: boolean;
  showCitiesToggle?: boolean;
}

@Component({
  selector: "app-city-user-view",
  templateUrl: "./city-user-view.component.html",
  styleUrl: "./city-user-view.component.css",
})
export class CityUserViewComponent implements OnInit, OnDestroy {
  isLoader: boolean = false;
  selectedCityUser: GetUserByRoleResponse | null = null;
  cityUserResponse: PaginationResponse<CityUserRow> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  cities: CityVM[] | null = [];
  loading: boolean = false;
  isOpendialog: boolean = false;
  roleId: number | any = 0;
  selectedRoleID: UserRoleValue | any = "";
  selectedIndex?: number;
  pillars: PillarsVM[] = [];

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.roleId = params.get("roleID");
      this.selectedRoleID = this.roleId;
    });
    this.getCityUser();
    this.getAllCitiesByUserId();
    this.getAllPillars();
  }

  getAllPillars() {
    this.adminService.getAllPillars().subscribe({
      next: (res) => {
        this.pillars = res ?? [];
      },
    });
  }

  getAllCitiesByUserId() {
    this.adminService
      .getAllCitiesByUserId(this.userService?.userInfo?.userID)
      .subscribe({
        next: (res) => {
          this.cities = res.result;
        },
      });
  }

  getCityUser(currentPage: number = 1) {
    this.cityUserResponse = undefined;
    this.isLoader = true;
    let payload: GetUserByRoleRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "userID",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userID: this.userService?.userInfo?.userID,
    };
    if (!this.roleId) {
      payload.getUserRole = UserRoleValue.CityUser;
    }
    this.adminService.getAnalyst(payload).subscribe((cityUserList) => {
      this.cityUserResponse = {
        ...cityUserList,
        data: (cityUserList.data ?? []).map((user) => this.mapCityUserRow(user)),
      };
      this.totalRecords = cityUserList.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cityUserList.pageSize;
      this.isLoader = false;
    });
  }

  private mapCityUserRow(user: GetUserByRoleResponse): CityUserRow {
    const citiesText = this.getCitiesText(user);
    return {
      ...user,
      citiesText,
      citiesExpand: false,
      showCitiesToggle: this.isLongCityText(citiesText),
    };
  }

  getCitiesText(user: GetUserByRoleResponse): string {
    return (user.cities ?? [])
      .map((city) => city?.cityName)
      .filter((name): name is string => !!name)
      .join(", ");
  }

  isLongCityText(text: string): boolean {
    if (!text) {
      return false;
    }
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length > 16 || text.length > 72;
  }

  toggleCities(cityUser: CityUserRow): void {
    cityUser.citiesExpand = !cityUser.citiesExpand;
  }

  editCityUser(cityUser: GetUserByRoleResponse | null, isOpen: boolean = true) {
    this.selectedCityUser = cityUser;
    if (isOpen) {
      this.opendialog();
    }
  }

  deleteCityUser() {
    if (this.selectedCityUser === null) {
      this.toaster.showError("No city user selected for deletion");
      return;
    }
    this.adminService.deleteUser(this.selectedCityUser.userID).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getCityUser(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(", "));
        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to delete city user");
      },
    });
  }

  ResendInvitaion(cityUser: GetUserByRoleResponse, i: number) {
    this.selectedIndex = i;
    let payload: UpdateInviteUserDto = {
      fullName: cityUser.fullName,
      email: cityUser.email,
      phone: cityUser.phone ?? "",
      password: "",
      role: UserRoleValue.CityUser,
      invitedUserID: this.userService.userInfo?.userID ?? 0,
      cityID: cityUser.cities?.map((x) => x.cityID) ?? [],
      userID: cityUser.userID,
      pillars: cityUser.pillars,
      tier: cityUser.tier,
    };
    this.addUpdateCityUser(payload);
  }

  addUpdateCityUser(cityUser: UpdateInviteUserDto | null) {
    if (!cityUser) {
      return;
    }
    this.loading = true;
    let payload: UpdateInviteUserDto = {
      fullName: cityUser.fullName,
      email: cityUser.email,
      phone: cityUser.phone,
      password: cityUser.password,
      role: UserRoleValue.CityUser,
      invitedUserID: this.userService.userInfo?.userID ?? 0,
      cityID: cityUser.isAllCities ? [] : cityUser.cityID,
      isAllCities: !!cityUser.isAllCities,
      userID: cityUser.userID,
      tier: cityUser.tier,
      pillars: cityUser.pillars,
    };
    payload.tier = payload.tier ? Number(payload.tier) : 0;
    if (cityUser.userID > 0) {
      this.adminService.editAnalyst(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.toaster.showSuccess(res?.messages.join(", "));
          } else {
            this.toaster.showError(res?.errors.join(", "));
          }
          this.getCityUser(this.currentPage);
        },
        error: () => {
          this.closeModal();
          this.toaster.showError("Failed to edit city user");
        },
      });
    } else {
      this.adminService.addAnalyst(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.toaster.showSuccess(res?.messages.join(", "));
          } else {
            this.toaster.showError(res?.errors.join(", "));
          }
          this.getCityUser();
        },
        error: () => {
          this.closeModal();
          this.toaster.showError("Failed to add city user");
        },
      });
    }
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
        modalInstance.show();
      }
    }, 100);
  }

  closeModal() {
    this.selectedIndex = undefined;
    this.loading = false;
    const homeTab = document.querySelector("#pills-home-tab") as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    this.isOpendialog = false;
  }

  ngOnDestroy(): void {}

  addBulkCityUser(cityUsers: UpdateInviteUserDto[] | null) {
    if (!cityUsers) return;
    let payload: InviteBulkUserDto = {
      users: cityUsers,
    };
    this.loading = true;
    this.adminService.addBulkAnalyst(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getCityUser();
          this.toaster.showSuccess(res?.messages.join(", "));
        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError("Failed to add city user");
      },
    });
  }
}
