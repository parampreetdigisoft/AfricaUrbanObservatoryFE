import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  private successSubject = new Subject<string>();
  private errorSubject = new Subject<string>();
  private infoSubject = new Subject<string>();
  private warningSubject = new Subject<string>();

  tryAgain ='There is an error occur please try again !';
  tryLater ='There is an error occur please try later !';
  constructor() { } 
  
  get success$() {
    return this.successSubject.asObservable();
  }
  get error$() {
    return this.errorSubject.asObservable();
  }
  get info$() {
    return this.infoSubject.asObservable();
  }
  get warning$() {
    return this.warningSubject.asObservable();
  }


  public showSuccess(message: string) {
    this.successSubject.next(message);
  }

  public showError(message: string) {
    this.errorSubject.next(message);
  }

  public showInfo(message: string) {
    this.infoSubject.next(message);
  }

  public showWarning(message: string) {
    this.warningSubject.next(message);
  }
}
