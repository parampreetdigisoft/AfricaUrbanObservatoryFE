import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphSomeSepecial]'
})
export class AlphSomeSepecialDirective {


   private regex: RegExp = new RegExp(/^[a-zA-Z\s,./_\-?']*$/);
 
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
