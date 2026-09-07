import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToasterService } from './core/services/toaster.service';
import { Subject, takeUntil } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'usvi-angular-app';
  toastMessage = '';
  toastClass = '';
  private destroy$ = new Subject<void>();

  constructor(private toasterService: ToasterService) {}

  ngOnInit(): void {
    this.toasterService.success$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => this.showToaster(message, 'success'));

    this.toasterService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => this.showToaster(message, 'danger'));

    this.toasterService.info$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => this.showToaster(message, 'info'));

    this.toasterService.warning$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => this.showToaster(message, 'warning'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private showToaster(message: string, type: string) {
    this.toastMessage = message;
    this.toastClass = type;

    const toastEl = document.getElementById('liveToastBtn');
    if (!toastEl) return;

    // Remove all old type classes first
    toastEl.classList.remove('success', 'danger', 'info', 'warning');
    toastEl.classList.add(type);

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2000 });
    toast.show();
  }
}
