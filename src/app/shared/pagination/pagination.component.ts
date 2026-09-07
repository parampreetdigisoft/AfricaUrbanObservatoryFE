import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone:true,
  imports:[CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnChanges {

  constructor(private ctx: ChangeDetectorRef) { }
  ngOnChanges(changes: SimpleChanges): void 
  {
    this.ctx.detectChanges();
  }
   currentYear = new Date().getFullYear();
  @Input() isLoader: boolean = false;
  @Input() currentPage: number = 1;
  @Input() totalPage: number = 0; // total items
  @Input() pageSize: number = 10;
  @Input() selectedYear: number = new Date().getFullYear();

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalPage / this.pageSize);
  }
  get minValue(): number {
    return Math.min(this.pageSize * this.currentPage, this.totalPage);
  }
  changePage(page: number | string): void {
    if (typeof page === 'string') return;
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  // Generate page numbers with ellipsis
  getPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if less than or equal to 7
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 3) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  }

}
