import { Component, OnDestroy, OnInit } from '@angular/core';
import { CityVM } from '../../../../core/models/CityVM';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { GetUserByRoleRequestDto, GetUserByRoleResponse } from '../../../../core/models/GetUserByRoleResponse';
import { UserRoleValue } from 'src/app/core/enums/UserRole';
import { InviteBulkUserDto, UpdateInviteUserDto } from '../../../../core/models/AnalystVM';
import { AnalystService } from '../../analyst.service';
declare var bootstrap: any;

@Component({
  selector: 'app-evaluator-view',
  templateUrl: './evaluator-view.component.html',
  styleUrl: './evaluator-view.component.css'
})
export class EvaluatorViewComponent implements OnInit, OnDestroy {
  selectedEvaluator: GetUserByRoleResponse | null = null;
  loading: boolean = false;
  evaluatorResponse: PaginationResponse<GetUserByRoleResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1
  cities: CityVM[] | null = [];
  isLoader: boolean = false;
  isOpendialog: boolean = false;
  selectedIndex?:number;
  constructor(private analystService: AnalystService, private toaster: ToasterService, private userService: UserService) { }

  ngOnInit(): void {
    this.getEvaluator();
    this.getAllCitiesByUserId();
  }

  getAllCitiesByUserId() {
    this.analystService.getAllCitiesByUserId(this.userService?.userInfo?.userID).subscribe({
      next: (res) => {
        this.cities = res.result;
      }
    });
  }

  getEvaluator(currentPage: number = 1) {
    this.evaluatorResponse = undefined;
    this.isLoader = true;
    let payload: GetUserByRoleRequestDto = {
      sortDirection: 'asc',
      sortBy: 'fullName',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userID: this.userService?.userInfo?.userID,
      getUserRole: UserRoleValue.Evaluator
    }

    this.analystService.getEvaluator(payload).subscribe(anaylist => {
      this.evaluatorResponse = anaylist;
      this.totalRecords = anaylist.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = anaylist.pageSize;
      this.isLoader = false;
    });
  }

  editEvaluator(evaluator: GetUserByRoleResponse | null, isOpen:boolean=true) {
    this.selectedEvaluator = evaluator;
    if(isOpen){
      this.opendialog();
    }
  }

  deleteEvaluator() {
    let payload = {
      userId: this.selectedEvaluator?.userID,
      assignedByUserId: this.userService.userInfo.userID
    }
    this.analystService.unAssignCity(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getEvaluator();
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.toaster.showError('Failed to un-assigned city');
      }
    });
  }

  ResendInvitaion(analyst: GetUserByRoleResponse, i :number) {
    this.selectedIndex =i;
    let payload: UpdateInviteUserDto = {
      fullName: analyst.fullName,
      email: analyst.email,
      phone: analyst.phone ?? "",
      password: "",
      role: UserRoleValue.Evaluator,
      invitedUserID: this.userService.userInfo?.userID ?? 0,
      cityID: analyst.cities.map((x) => x.cityID),
      userID: analyst.userID,
    };
    this.addUpdateEvaluator(payload);
  }
  addUpdateEvaluator(evaluator: UpdateInviteUserDto | null) {
    if (!evaluator) {
      return;
    }
    this.loading = true;
    let payload: UpdateInviteUserDto = {
      fullName: evaluator.fullName,
      email: evaluator.email,
      phone: evaluator.phone,
      password: evaluator.password,
      role: UserRoleValue.Evaluator,
      invitedUserID: this.userService.userInfo?.userID ?? 0,
      cityID: evaluator.cityID,
      userID: evaluator.userID
    }

    if (evaluator?.userID > 0) {
      this.analystService.editEvaluator(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.getEvaluator(this.currentPage);
            this.toaster.showSuccess(res?.messages.join(', '));

          } else {
            this.toaster.showError(res?.errors.join(', '));
          }
        },
        error: () => {
          this.closeModal();
          this.toaster.showError('Failed to edit evaluator');
        }
      });
    }
    else {
      this.analystService.addEvaluator(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.getEvaluator();
            this.toaster.showSuccess(res?.messages.join(', '));
          } else {
            this.toaster.showError(res?.errors.join(', '));
          }
        },
        error: () => {
          this.closeModal();
          this.toaster.showError('Failed to add evaluator');
        }
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
    if(modalInstance)
    modalInstance.hide();
    this.isOpendialog = false;
  }

  ngOnDestroy(): void {

  }
  addBulkAnalyst(analysts: UpdateInviteUserDto[] | null) {
    if (!analysts) return;
    let payload: InviteBulkUserDto = {
      users: analysts
    }
   this.loading = true;
    this.analystService.addBulkEvaluator(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getEvaluator();
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to add analyst');
      }
    });
  }
}
