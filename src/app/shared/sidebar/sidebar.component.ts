import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { StorageKeyEnum } from 'src/app/core/enums/StorageKeyEnum';
import { AssessmentWithProgressVM } from 'src/app/core/models/AssessmentResponse';
import { UserInfo } from 'src/app/core/models/UserInfo';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  assessmentProgress: AssessmentWithProgressVM | null =  null;
  userRole = signal<string>('');
  private destroy$ = new Subject();

  constructor(private userService: UserService, public router: Router, private ctx: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userRole.set(this.userInfo?.role?.toLowerCase());
    if (!this.userRole) {
      setTimeout(() => {
        this.userRole.set(this.userInfo?.role?.toLowerCase());
        this.userService.RedirectBasedOnRole();
        this.ctx.detectChanges();
      }, 1000);
    }
    this.userService.assessmentProgress.subscribe(res => {
      this.assessmentProgress = res;
      if (res) {
        setTimeout(() => {
          this.ctx.detectChanges();
        }, 100);
      }
    });
  }
  get userInfo(): UserInfo {
    return this.userService.userInfo;
  }

  get isAdmin(): boolean {
    return this.userRole() === 'admin';
  }
  get isAnalyst(): boolean {
    return this.userRole() === 'analyst';
  }
  get isEvaluator(): boolean {
    return this.userRole() === 'evaluator';
  }
  get isCityUser(): boolean {
    return this.userRole() === 'cityuser';
  }

  logout() {
    this.userService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }
}
