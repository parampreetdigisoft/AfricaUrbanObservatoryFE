import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';

@Directive({
  selector: '[utcToLocalTooltip]',
  providers: [DatePipe],
  standalone: true
})
export class UtcToLocalTooltipDirective implements OnChanges {

  @Input('utcToLocalTooltip') utcDate?: string | Date | null;
  @Input() tooltipFormat = 'dd MMM yyyy, hh:mm a';

  constructor(
    private tooltip: MatTooltip,
    private datePipe: DatePipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.utcDate) {
      this.tooltip.message = '';
      this.tooltip.disabled = true;
      return;
    }

    const localDate = new Date(this.utcDate); // JS auto converts UTC → local

    const formatted =
      this.datePipe.transform(localDate, this.tooltipFormat) ?? '';

    this.tooltip.message = formatted;
    this.tooltip.disabled = false;
  }
}
