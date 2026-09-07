import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { UserInfo } from '../core/models/UserInfo';
import { UserRole } from '../core/enums/UserRole';
import { TieredAccessPlanValue } from '../core/enums/TieredAccessPlan';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser = signal<UserInfo | null>(null);
  cityUser = UserRole.CityUser;
  evaluator = UserRole.Evaluator;
  pendingTier= TieredAccessPlanValue.Pending;
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUrl = this.router.url;
    if (currentUrl === '/' || currentUrl === '') {
      this.userService.RedirectBasedOnRole();
    }
    this.currentUser.set(this.userService.userInfo);

    this.userService.refreshSidebar.subscribe((res) => {
      if (res) {
        this.currentUser.set(this.userService.userInfo);
        this.userService.RedirectBasedOnRole();
      }
    });
  }
} 