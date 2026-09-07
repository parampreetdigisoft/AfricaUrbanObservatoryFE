import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TransferAssessmentRequestDto } from "src/app/core/models/AssessmentRequest";
import { GetAssessmentResponse } from "src/app/core/models/AssessmentResponse";

@Component({
  selector: "app-transter-assessment",
  templateUrl: "./transter-assessment.component.html",
  styleUrl: "./transter-assessment.component.css",
})
export class TransterAssessmentComponent {
  @Input() assesment: GetAssessmentResponse | null | undefined = null;
  @Output() assesmentChange = new EventEmitter<TransferAssessmentRequestDto>();
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() loading: boolean = false;
  @Input() userofSelecteCityResponse: GetAssessmentResponse[] = [];
  selectedUserAssesment: GetAssessmentResponse | null = null;
  isSubmitted = false;
  assesmentForm!: FormGroup;
  alertMsg = "";

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.isSubmitted = false;
    this.assesmentForm = this.fb.group({
      assessmentID: [this.assesment?.assessmentID, Validators.required],
      transferToUserID: [null, Validators.required],
    });
  }
  selectedUser(event: GetAssessmentResponse) {
    this.selectedUserAssesment = event;
  }
  onSubmit() {
    this.isSubmitted = true;
    if (this.assesmentForm.valid) {
      this.assesmentChange.emit(this.assesmentForm.value);
    }
  }
  closeModel() {
    this.closeModal.emit(true);
  }
}
