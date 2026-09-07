import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EvaluatorService } from '../../evaluator.service';
import { CityVM } from 'src/app/core/models/CityVM';

@Component({
  selector: 'app-assigned-city',
  templateUrl: './assigned-city.component.html',
  styleUrl: './assigned-city.component.css'
})
export class AssignedCityComponent implements OnInit, OnDestroy {
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1
  isLoader: boolean = false;
  constructor(private evaluatorService: EvaluatorService, private userService: UserService, private toaster: ToasterService) { }
  ngOnDestroy(): void {

  }
  ngOnInit(): void {
    this.getCities();
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
    this.evaluatorService.getCities(payload).subscribe(cities => {
      this.citiesResponse = cities;
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;
    });
  }

}