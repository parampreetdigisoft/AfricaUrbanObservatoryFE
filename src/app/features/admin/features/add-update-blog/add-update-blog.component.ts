import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BlogVM } from 'src/app/core/models/blog/blogVM';
import { environment } from 'src/environments/environment';
import { QuillModule } from 'ngx-quill';
@Component({
  selector: 'app-add-update-blog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    QuillModule
  ],
  templateUrl: './add-update-blog.component.html',
  styleUrl: './add-update-blog.component.css'
})
export class AddUpdateBlogComponent {
  urlBase = environment.apiUrl;
  selectedFile: File | null = null;
  @Input() blog: BlogVM | null | undefined = null;
  @Output() blogChange = new EventEmitter<FormData>();
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() loading: boolean = false;
  isSubmitted = false;
  blogForm!: FormGroup;
  isEditMode = false;
  selectedBlogId!: number;
  minDate!: string;
  imagePreview: string | ArrayBuffer | null = null;
 

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.initForm();
  }

  initForm() {
    this.blogForm = this.fb.group({
      blogID: [this.blog?.blogID || 0],
      title: [this.blog?.title || '', Validators.required],
      category: [this.blog?.category || '', Validators.required],
      author: [this.blog?.author || '', Validators.required],
      publishDate: [this.formatDate(this.blog?.publishDate), Validators.required],
      description: [this.blog?.description || '', [Validators.required, Validators.minLength(20)]],
      imageFile: [''],
      imageUrl: [this.blog?.imageUrl || ''],
    });
  }
  formatDate(date: any): string {
    if (!date) return '';

    return date.split('T')[0];
  }


  onSubmit() {
    this.isSubmitted = true;
    if (this.blogForm.invalid) return;

    const formData = new FormData();

    formData.append('BlogID', this.blogForm.value.blogID || '');
    formData.append('Title', this.blogForm.value.title);
    formData.append('Category', this.blogForm.value.category);
    formData.append('Author', this.blogForm.value.author);
    formData.append('Description', this.blogForm.value.description);
    formData.append('publishDate', this.blogForm.value.publishDate);
    formData.append('ImageUrl', this.blogForm.value.imageUrl);

    if (this.selectedFile) {
      formData.append('imageFile', this.selectedFile);
    }

    this.blogChange.emit(formData);
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
  closeModel() {
    this.closeModal.emit(true);
  }

  onFileChange(event: any) {
  const file = event.target.files[0];
  this.selectedFile = file;
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

  openPicker(event: any) {
    event.target.showPicker?.();
  }

}
