import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AiCitySummeryDto } from 'src/app/core/models/aiVm/AiCitySummeryDto';

@Component({
  selector: 'app-add-comment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-comment.component.html',
  styleUrls: ['./add-comment.component.css']
})
export class AddCommentComponent implements OnInit, OnChanges {

  @Input() city?: AiCitySummeryDto | null = null;
  @Input() loading = false;

  @Output() onSubmit = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<boolean>();

  commentForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['city'] && this.commentForm) {
      this.commentForm.patchValue({
        cityID: this.city?.cityID,
        comment:[this.city?.comment]
      });
    }
  }

  private buildForm(): void {
    this.commentForm = this.fb.group({
      cityID: [this.city?.cityID],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  submit(): void {
    if (this.commentForm.invalid || !this.city) return;

    this.onSubmit.emit(this.commentForm.value);
  }

  closeModel(): void {
    this.closeModal.emit(true);
  }
}
