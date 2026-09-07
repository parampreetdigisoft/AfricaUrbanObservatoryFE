import { Component, EventEmitter, Input, Output, OnDestroy, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-twofa-verification',
  templateUrl: './twofa-verification.component.html',
  styleUrls: ['./twofa-verification.component.css']
})
export class TwofaVerificationComponent implements OnInit, OnDestroy {
  @Output() twofaVerification = new EventEmitter<number>();
  @Output() reSendOtp = new EventEmitter<void>();
  @Input() loading = false;
  @Input() isSuccess = false;

  otpForm!: FormGroup;
  canResend = true;
  resendTimer = 0;
  private timerInterval: any;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.startResendCountdown(120);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private initializeForm() {
    this.otpForm = this.fb.group({
      digits: this.fb.array(
        Array.from({ length: 6 }, () => this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)]))
      )
    });
  }

  get digits(): FormArray {
    return this.otpForm.get('digits') as FormArray;
  }

  onKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    if (key === 'Backspace' && !input.value && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    } else if (input.value && index < this.digits.length - 1) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    } else if (key === 'ArrowLeft' && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    } else if (key === 'ArrowRight' && index < this.digits.length - 1) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const otp = this.digits.value.join('');
    this.twofaVerification.emit(Number(otp));
  }

  reSendLoginOtp(): void {
    if (!this.canResend) return;

    this.reSendOtp.emit();
    this.startResendCountdown(120);
  }

  private startResendCountdown(seconds: number) {
    this.canResend = false;
    this.resendTimer = seconds;

    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }
}
