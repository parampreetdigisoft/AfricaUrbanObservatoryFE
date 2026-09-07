import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { AddBulkQuestionsDto, AddQuestionRequest, GetQuestionRequest, GetQuestionResponse } from 'src/app/core/models/QuestonResponse';
import { SortDirection } from 'src/app/core/enums/SortDirection';
declare var bootstrap: any;

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrl: './question.component.css'
})
export class QuestionComponent implements OnInit, OnDestroy {
  selectedQuestion: GetQuestionResponse | null = null;
  selectedPiller: PillarsVM | null = null;
  pillers: PillarsVM[] = [];
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1
  questions: GetQuestionResponse[] = [];
  selectedPillarId: number | any = "";
  loading: boolean = false;
  isLoader: boolean = false;
  isOpendialog: boolean = false;

  constructor(private adminService: AdminService, private toaster: ToasterService, private userService: UserService) { }

  ngOnInit(): void {
    this.GetAllPillars();
    this.GetQuestions();
  }

  GetAllPillars() {
    this.adminService.getAllPillars().subscribe(p => {
      this.pillers = p;
    });
  }
  GetQuestions(currentPage: number = 1) {
    this.questions= [];
    this.isLoader = true;
    let payload: GetQuestionRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'questionID',
      pageNumber: currentPage,
      pageSize: this.pageSize
    }
    if (this.selectedPillarId != "") {
      payload.pillarID = this.selectedPillarId;
    }

    this.adminService.getQuestions(payload).subscribe(question => {
      this.totalRecords = question.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = question.pageSize;
      this.questions = question.data;
      this.isLoader = false;
    });
  }
  onPillarChange() {
    this.currentPage = 1;
    this.GetQuestions(1);
  }

  editQuestion(question: GetQuestionResponse | null, isOpen:boolean =true) {
    this.selectedQuestion = question;
    if(isOpen){
     this.opendialog();
    }
  }
  deleteQuestion() {
    if (this.selectedQuestion === null) {
      this.toaster.showError('No question selected for deletion');
      return;
    }
    this.adminService.deleteQuestion(this.selectedQuestion.questionID).subscribe({
      next: (res) => {
        this.GetQuestions(this.currentPage);
        this.toaster.showSuccess('Question deleted successfully');
      },
      error: () => {
        this.toaster.showError('Failed to delete question');
      }
    });
  }
  addUpdateQuestion(question: AddQuestionRequest | null) {
    if (!question) {
      return;
    }
    this.loading = true;
    this.adminService.addUpdateQuestion(question).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.GetQuestions(question.questionID > 0 ? this.currentPage : 1);
          this.toaster.showSuccess(res?.messages.join(', '));

        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        if (question.questionID > 0) {
          this.toaster.showError("Failed to update question ");
        } else {
          this.toaster.showError("Failed to create question");
        }
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
    modalInstance.hide();
    this.isOpendialog =false;
  }
  ngOnDestroy(): void {

  }

  addBulkQuestion(questions: AddQuestionRequest[] | null) {
    if (!questions) {
      return;
    }
    this.loading = true;
    let payload: AddBulkQuestionsDto = {
      questions: questions
    }

    this.adminService.addBulkQuestions(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.GetQuestions(1);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError("Failed to create question");
      }
    });
  }

}