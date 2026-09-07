import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphaOnly]' // use this attribute in HTML
})
export class AlphaOnlyDirective {

  // regex: only alphabets and spaces
  private regex: RegExp = new RegExp(/^[a-zA-Z\s]*$/);

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const inputChar = String.fromCharCode(event.charCode);

    // block if character is not allowed
    if (!this.regex.test(inputChar)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const pastedInput: string = event.clipboardData?.getData('text') ?? '';
    if (!this.regex.test(pastedInput)) {
      event.preventDefault();
    }
  }
}