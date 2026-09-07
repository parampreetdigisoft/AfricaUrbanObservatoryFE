import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]'
})
export class NumberOnlyDirective {

  // ✅ FIX: removed 'g' flag
  private regex: RegExp = /^-?\d*\.?\d{0,2}$/;

  private specialKeys: Array<string> = [
    'Backspace', 'Tab', 'End', 'Home',
    'ArrowLeft', 'ArrowRight', 'Delete'
  ];

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    // ✅ Allow: Ctrl/Cmd + A/C/V/X
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    // ✅ Allow navigation keys
    if (this.specialKeys.includes(event.key)) {
      return;
    }

    const input = this.el.nativeElement;
    const current: string = input.value;
    const position = input.selectionStart;

    const next: string = [
      current.slice(0, position),
      event.key === 'Decimal' ? '.' : event.key,
      current.slice(position)
    ].join('');

    // ✅ Allow minus only at start
    if (event.key === '-') {
      if (position !== 0 || current.includes('-')) {
        event.preventDefault();
      }
      return;
    }

    // ✅ Validate input
    if (next && !this.regex.test(next)) {
      event.preventDefault();
    }
  }

  // ✅ Handle Paste
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData?.getData('text') || '';

    const input = this.el.nativeElement;
    const current: string = input.value;
    const position = input.selectionStart;

    const next = [
      current.slice(0, position),
      clipboardData,
      current.slice(position)
    ].join('');

    if (!this.regex.test(next)) {
      event.preventDefault();
    }
  }

  // ✅ Optional: Handle Drag-Drop
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    const text = event.dataTransfer?.getData('text') || '';

    const input = this.el.nativeElement;
    const current: string = input.value;
    const position = input.selectionStart;

    const next = [
      current.slice(0, position),
      text,
      current.slice(position)
    ].join('');

    if (!this.regex.test(next)) {
      event.preventDefault();
    }
  }
}