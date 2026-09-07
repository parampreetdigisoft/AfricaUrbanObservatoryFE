import { Component } from '@angular/core';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { BlogVM } from 'src/app/core/models/blog/blogVM';
import { PaginationRequest, PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { AdminService } from '../../admin.service';
import { CommonModule } from '@angular/common';
import { AddUpdateBlogComponent } from '../../features/add-update-blog/add-update-blog.component';
import { PromptComponent } from 'src/app/shared/prompt/prompt.component';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
declare var bootstrap: any;
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, AddUpdateBlogComponent, PromptComponent, PaginationComponent],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css'
})
export class BlogComponent {

  urlBase = environment.apiUrl;
  selectedBlog: BlogVM | null | undefined = null;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  isLoader: boolean = false;
  isOpendialog = false;
  isExporting: boolean = false;
  blogs: BlogVM[] = [];
  constructor(private adminService: AdminService, private toaster: ToasterService, private userService: UserService) { }

  ngOnInit(): void {
    this.getblogs(1);
  }
  ngOnDestroy(): void {

  }
  getblogs(currentPage: number = 1) {
    this.blogs = [];
    //this.isLoader = true;
    let payload: PaginationRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'UpdatedAt',
      pageNumber: currentPage,
      pageSize: this.pageSize
    }

    this.adminService.getBlogs(payload).subscribe({
      next: (res) => {
        this.blogs = res.data.map(p => ({
          ...p,
          expand: false,
          showToggle: this.isLongText(p.description)
        })
        );;

        this.totalRecords = res.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = res.pageSize;
        this.isLoader = false;
      },
      error: () => { }

    });

  }

  editBlog(blog: BlogVM | null) {
    this.selectedBlog = blog;
  }
  deleteBlog() {
    if (this.selectedBlog === null) {
      this.toaster.showError('No blog selected for deletion');
      return;
    }
    this.adminService.deleteBlog(this.selectedBlog?.blogID ?? 0).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getblogs(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.toaster.showError('Failed to delete blog');
      }
    });
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
  isLongText(html: string): boolean {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.innerText || temp.textContent || "";
    return text.split(/\s+/).length > 40; // approx 4 lines
  }

  addUpdateBlog(formData: any) {
    this.loading = true;
    this.adminService.addUpdateBlog(formData).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getblogs(this.currentPage);
          this.toaster.showSuccess(res?.messages?.join(', '));
        } else {
          this.toaster.showError(res?.errors?.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to edit blog');
      }
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
  openBlogModal(blog: BlogVM | null) {
    this.selectedBlog = blog ?? null;
    this.opendialog();
  }

  decodeHtml(text: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value.replace(/\u00a0/g, ' '); // Replace non-breaking space with normal space
  }
}
