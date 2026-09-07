import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GetUserByRoleResponse } from 'src/app/core/models/GetUserByRoleResponse';
import { PillarsVM } from 'src/app/core/models/PillersVM';

@Component({
  selector: 'app-update-pillar',
  templateUrl: './update-pillar.component.html',
  styleUrl: './update-pillar.component.css'
})
export class UpdatePillarComponent implements OnInit, AfterViewInit {
  @Input() pillar: PillarsVM | null = null;
  @Output() pillarChange = new EventEmitter<PillarsVM | null>();
  @Input() loading: boolean = false;

  isSubmitted = false;
  pillarForm!: FormGroup;

  constructor(private fb: FormBuilder) { }
  ngAfterViewInit(): void {

  }
  onEditorCreated(quill: any) {
    const html = this.pillarForm.get('description')?.value ?? '';
    if (html) {
      // ensures content appears even if initialization happened early
      quill.clipboard.dangerouslyPasteHTML(html);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.pillarForm = this.fb.group({
      pillarName: ['', Validators.required],
      weight: ['1', [Validators.required, Validators.min(0.01)]],
      reliability: [true, [Validators.required]],
      description: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.isSubmitted = false;
    if (this.pillarForm && !this.loading) {
      this.pillarForm.patchValue({
        pillarName: this.pillar?.pillarName ?? '',
        description: this.pillar?.description ?? '',
        weight: this.pillar?.weight ?? 1,
        reliability: this.pillar?.reliability ?? 1
      });
    } else {
      //this.initializeForm();
    }
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.pillarForm.valid) {
      const pillarData: PillarsVM = {
        ...this.pillarForm.value,
        pillarID: this.pillar?.pillarID ?? 0,
        displayOrder: this.pillar?.displayOrder
      };

      this.pillarChange.emit(pillarData);
      this.isSubmitted = false;
    }
  }
}