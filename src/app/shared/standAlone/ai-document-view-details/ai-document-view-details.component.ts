import { Component, computed, EventEmitter, input, Input, OnChanges, OnInit, Output, output, signal, SimpleChanges } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { FormsModule } from '@angular/forms';
import { PromptComponent } from '../../prompt/prompt.component';
import { GetCityDocumentResponseDto, GetCityPillarDocumentResponseDto } from 'src/app/core/models/aiVm/GetCityDocumentResponseDto';
import { DeleteCityDocumentRequestDto } from 'src/app/core/models/aiVm/AiCitySummeryRequestDto';

export interface SelectedFileModel {
  file: File;
  pillarID?: number;
  pillarName?: string;
}

@Component({
  selector: 'app-ai-document-view-details',
  standalone: true,
  imports: [CommonModule, FormsModule, PromptComponent],
  templateUrl: './ai-document-view-details.component.html',
  styleUrl: './ai-document-view-details.component.css'
})

export class AiDocumentViewDetailsComponent implements OnInit, OnChanges {

  selectCityDocument?: number | string;
  totalFiles = computed(() => (this.selectedCity()?.noOfFiles ?? 0) + this.selectedFiles().length);
  selectedCity = input<GetCityDocumentResponseDto | null | undefined>(null);
  documents = input<GetCityPillarDocumentResponseDto[]>([]);
  pillars = input<PillarsVM[]>([]);
  isUploadModalOpen = false;
  selectedFiles = signal<SelectedFileModel[]>([]);
  selectedPillarID?: number;
  @Output() uploadedDocuments = new EventEmitter<FormData>();
  @Output() deleteDocument = new EventEmitter<DeleteCityDocumentRequestDto>();
  @Output() downloadDocument = new EventEmitter<GetCityPillarDocumentResponseDto>();
  @Input() saveDocumentLoader: boolean = false;
  @Output() refresh: EventEmitter<void> = new EventEmitter<void>();
  cityDocuments = computed(() =>
    this.documents().filter(x => !x.pillarID)
  );

  pillarDocuments = computed(() =>
    this.documents().filter(x => x.pillarID != null && x.pillarID > 0)
  );

  urlBase = environment.apiUrl;

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.selectedFiles.set([]);
    this.selectCityDocument = this.selectedCity()?.cityID
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];

      if (!allowedTypes.includes(file.type)) continue;

      const exists = this.selectedFiles().some(
        f => f.file.name === file.name && f.file.size === file.size
      );

      if (!exists) {
        let f: SelectedFileModel = {
          pillarID: this.selectedPillarID,
          pillarName: this.pillars().find(x => x.pillarID == this.selectedPillarID)?.pillarName,
          file: file
        }

        this.selectedFiles.update(files => [...files, f]);
        this.selectedPillarID = undefined;
      }
    }

    input.value = '';
  }

  removeFile(index: number) {
    this.selectedFiles.update(files =>
      files.filter((_, i) => i !== index)
    );
  }

  formatFileSize(size: number): string {
    return (size / 1024).toFixed(2) + ' KB';
  }

  uploadDocuments() {
    const formData = new FormData();
    if (this.selectCityDocument && this.selectCityDocument != undefined && this.selectCityDocument != "undefined") {
      formData.append('CityID', this.selectCityDocument.toString());
    }
    this.selectedFiles().forEach((item, index) => {
      formData.append('Files', item.file); 
      formData.append('PillarIDs', item.pillarID?.toString() ?? '0');
    });
    this.uploadedDocuments.emit(formData);
  }

  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.selectedFiles.set([]);
    this.selectedPillarID = undefined;
  }

  doneUploadModal() {
    this.isUploadModalOpen = false;
    this.selectedPillarID = undefined;
  }

  deleteCityDocument(doc: GetCityPillarDocumentResponseDto) {
    let payload: DeleteCityDocumentRequestDto = {
      cityID: this.selectedCity()?.cityID ?? 0,
      cityDocumentID: doc?.cityDocumentID,
      isAll: false
    }
    this.deleteDocument.emit(payload);
  }

  download(doc: GetCityPillarDocumentResponseDto) {
    this.downloadDocument.emit(doc);
  }
  onClose()
  {
    this.refresh.emit();
  }
}

