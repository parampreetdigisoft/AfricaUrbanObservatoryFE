import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PublicUserResponse } from 'src/app/core/models/UserInfo';
import { AiCitySummeryDto } from 'src/app/core/models/aiVm/AiCitySummeryDto';

@Component({
  selector: 'app-regenerate-ai-score-and-add-viewer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './regenerate-ai-score-and-add-viewer.component.html',
  styleUrl: './regenerate-ai-score-and-add-viewer.component.css'
})
export class RegenerateAiScoreAndAddViewerComponent implements OnInit, OnChanges {

  @Input() city?: AiCitySummeryDto | any | null = null;
  @Input() loading = false;
  @Input() evaluatorList: PublicUserResponse[] = [];
  @Output() regenerate = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() showRegenerateMissingQuestionsOption = false;
  @Input() importPillar = false;
  assesmentForm!: FormGroup;

  /** AI options config (easy to extend later) */
  aiOptions: any[] = [];

  constructor(private fb: FormBuilder, private ctx: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.initializeForm();
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.aiOptions = [
      { label: 'Pillar-level AI insights', control: 'pillarEnable', time: this.importPillar ? 2 : 15 },
      { label: 'Question-level AI insights', control: 'questionEnable', time: this.importPillar ? 30 : 120 }
    ];
    if (!this.importPillar) {
      this.aiOptions.unshift({ label: 'City-level AI insights', control: 'cityEnable', time: 5 });
      this.aiOptions.unshift({ label: 'Immediate Situation', control: 'immediateSummaryEnable', time: 2  });
    }
    if (this.showRegenerateMissingQuestionsOption)
    {
      const completionRate = Math.round(
    this.city?.aiCompletionRate ?? 0
  );

  this.aiOptions.push({
    label: 'Import Missing Questions',
    control: 'regenerateMissingQuestionsEnable',
    time: this.importPillar
      ? 30
      : Math.max(1, 120 - completionRate)
  });
    }
    this.ctx.detectChanges();
  }

  initializeForm() {
    this.assesmentForm = this.fb.group({
      cityID: [this.city?.cityID],
      cityEnable: [!this.importPillar],
      immediateSummaryEnable: [!this.importPillar],
      regenerateMissingQuestionsEnable: [false],
      pillarEnable: [true],
      questionEnable: [false],
      viewerUserIDs: [[]]   // multiple viewers
    });
  }

  onSubmit() {
    if (!this.city) return;

    const payload = {
      ...this.assesmentForm.value
    };

    this.regenerate.emit(payload);
  }

  closeModel() {
    this.closeModal.emit(true);
  }
}
