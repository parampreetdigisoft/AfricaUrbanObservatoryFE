import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-file-upload-modal',
  templateUrl: './file-upload-modal.component.html',
  styleUrl: './file-upload-modal.component.css'
})
export class FileUploadModalComponent {
  selectedFile: File | null = null;
  @Output() fileUploaded = new EventEmitter<File>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  // Capture file selection
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Emit file back to parent
  saveFile() {
    if (this.selectedFile) {
      this.fileUploaded.emit(this.selectedFile);
      this.closeModal();
    }
  }

  // Reset file after closing
  closeModal() {
    this.fileInput.nativeElement.value = "";
    this.selectedFile = null;
    const modal = document.getElementById('exampleModal');
    if (modal) {
      (modal as any).classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      (modal as any).style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }
}
