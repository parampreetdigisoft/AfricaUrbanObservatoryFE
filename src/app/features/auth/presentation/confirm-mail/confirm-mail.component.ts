import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-confirm-mail',
  templateUrl: './confirm-mail.component.html',
  styleUrl: './confirm-mail.component.css'
})
export class ConfirmMailComponent implements OnInit{
  private destroy$ = new Subject();
  @Output() confirmMail = new EventEmitter();
  constructor(private activatedRoute: ActivatedRoute) { }
  ngOnInit() {
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if(params['PasswordToken']){
        this.confirmMail.emit(params['PasswordToken'])
      }
    })
  }
}
