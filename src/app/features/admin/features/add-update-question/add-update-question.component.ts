import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddQuestionRequest, GetQuestionResponse, QuestionOption } from 'src/app/core/models/QuestonResponse';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-add-update-question',
  templateUrl: './add-update-question.component.html',
  styleUrl: './add-update-question.component.css'
})
export class AddUpdateQuestionComponent implements OnChanges, OnInit {

  @Input() question: GetQuestionResponse | null = null;
  @Input() pillers: PillarsVM[] = [];
  @Output() questionChange = new EventEmitter<AddQuestionRequest | null>();
  @Output() bulkQuestionChange = new EventEmitter<AddQuestionRequest[] | null>();
  @Output() closeModal = new EventEmitter<boolean>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() loading: boolean = false;
  isSubmitted = false;
  alertMsg = '';
  scoreOptions = [
    { scoreValue: 4 },
    { scoreValue: 3 },
    { scoreValue: 2 },
    { scoreValue: 1 },
    { scoreValue: 0 }
  ];
  excelData: any[] = [];
  requiredHeaders = [
    "QuestionText", "PillarName",
    "Option1Text", "Option1Score",
    "Option2Text", "Option2Score",
    "Option3Text", "Option3Score",
    "Option4Text", "Option4Score",
    "Option5Text", "Option5Score"
  ];
  scoreHeaders = [
    "Option1Score",
    "Option2Score",
    "Option3Score",
    "Option4Score",
    "Option5Score"
  ];

  questionForm: FormGroup<any> = this.fb.group({});

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm(this.question)
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initializeForm(this.question)
  }


  initializeForm(question: GetQuestionResponse | null) {
    this.questionForm = this.fb.group({
      questionText: [question?.questionText, Validators.required],
      pillarID: [question?.pillarID, Validators.required],
      questionOptions: this.fb.array([])
    });
    if ((question?.questionOptions?.length ?? 0) > 0) {
      question?.questionOptions.forEach(element => {
        if (element.scoreValue != null)
          this.addOption(element);
      });
    } else {
      this.addOption(null);
    }
  }

  get questionOptions(): FormArray {
    return this.questionForm.get('questionOptions') as FormArray;
  }

  createOption(option: QuestionOption | null = null): FormGroup {
    return this.fb.group({
      optionText: [option?.optionText, Validators.required],
      scoreValue: [option?.scoreValue ?? '', Validators.required],
      optionID: [option?.optionID ?? 0],
      questionID: [this.question?.questionID ?? 0]
    });
  }

  addOption(option: QuestionOption | null = null): void {
    this.questionOptions.push(this.createOption(option));
  }

  // Remove option at index
  removeOption(index: number): void {
    this.questionOptions.removeAt(index);
  }
  onSubmit() {
    this.isSubmitted = true;
    if (this.questionForm.valid) {
      const data: AddQuestionRequest = {
        ...this.questionForm.value,
        questionID: this.question?.questionID ?? 0
      };
      this.questionChange.emit(data);
    }
  }
  downloadTemplate() {
    const headers = [
      "QuestionText",
      "PillarName",
      "Option1Text", "Option1Score",
      "Option2Text", "Option2Score",
      "Option3Text", "Option3Score",
      "Option4Text", "Option4Score",
      "Option5Text", "Option5Score"
    ];

    // One sample row
    const sampleRow = {
      QuestionText: "Enter Question",
      PillarName: "Enter Pillar",
      Option1Text: "Enter Option 1", Option1Score: "0",
      Option2Text: "Enter Option 2", Option2Score: "1",
      Option3Text: "Enter Option 3", Option3Score: "2",
      Option4Text: "Enter Option 4", Option4Score: "3",
      Option5Text: "Enter Option 5", Option5Score: "4"
    };

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuestionsTemplate');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'QuestionsTemplate.xlsx');
  }
  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const jsonData = <any[]>XLSX.utils.sheet_to_json(ws, { defval: "" });

      // ✅ check headers
      const headers = Object.keys(jsonData[0] || {});
      const missingHeaders = this.requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        this.alertMsg = `Invalid file format. Missing headers: ${missingHeaders.join(", ")}`;
        this.fileInput.nativeElement.value = "";
        return;
      }

      const questions: AddQuestionRequest[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const pillarName = String(row["PillarName"] ?? "").trim();
        const questionText = String(row["QuestionText"] ?? "").trim();

        // ✅ case 1: blank row (skip)
        if (!pillarName && !questionText) {
          continue;
        }
        if(pillarName.toLowerCase() == "Enter Pillar".toLowerCase()) {
          continue;
        }

        // ✅ case 2: one missing → error
        if (!pillarName || !questionText) {
          this.alertMsg = `Row ${i + 2}: Both PillarName and QuestionText are required.`;
          this.fileInput.nativeElement.value = "";
          return;
        }

        // ✅ case 3: both present → validate pillar
        const pillar = this.getPillarByName(pillarName);
        if (!pillar) {
          this.alertMsg = `Row ${i + 2}: Invalid Pillar - ${pillarName}`;
          this.fileInput.nativeElement.value = "";
          return;
        }

        const question: AddQuestionRequest = {
          questionID: 0,
          pillarID: pillar.pillarID,
          questionText: questionText,
          questionOptions: [
            {
              optionID: 0,
              questionID: 0,
              optionText: String(row["Option1Text"] ?? "").trim(),
              scoreValue: this.parseScore(row["Option1Score"]),
              displayOrder: 1
            },
            {
              optionID: 0,
              questionID: 0,
              optionText: String(row["Option2Text"] ?? "").trim(),
              scoreValue: this.parseScore(row["Option2Score"]),
              displayOrder: 2
            },
            {
              optionID: 0,
              questionID: 0,
              optionText: String(row["Option3Text"] ?? "").trim(),
              scoreValue: this.parseScore(row["Option3Score"]),
              displayOrder: 3
            },
            {
              optionID: 0,
              questionID: 0,
              optionText: String(row["Option4Text"] ?? "").trim(),
              scoreValue: this.parseScore(row["Option4Score"]),
              displayOrder: 4
            },
            {
              optionID: 0,
              questionID: 0,
              optionText: String(row["Option5Text"] ?? "").trim(),
              scoreValue: this.parseScore(row["Option5Score"]),
              displayOrder: 5
            }
          ].filter(o => o.optionText) // ✅ remove empty options
        };

        questions.push(question);
      }
      this.excelData = questions;
    };

    reader.readAsBinaryString(target.files[0]);
  }


  private getPillarByName(pillarName: string): PillarsVM | undefined {
    return this.pillers.find(
      x => x.pillarName.toLowerCase().trim() === pillarName.trim().toLowerCase()
    );
  }

  private parseScore(val: any): number {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  bulkImport() {
    if (this.excelData.length > 0 && this.fileInput.nativeElement.value != "") {
      this.bulkQuestionChange.emit(this.excelData);
      this.fileInput.nativeElement.value = "";
      this.excelData = [];
    }
  }
  closeModel() {
    if( this.fileInput?.nativeElement?.value)
    this.fileInput.nativeElement.value = "";
    this.alertMsg = ''
    this.closeModal.emit(true);
  }
}
