import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonService } from 'src/app/core/services/common.service';

@Component({
  selector: 'app-circular-score',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './circular-score.component.html',
  styleUrl: './circular-score.component.css'
})
export class CircularScoreComponent implements OnInit, OnChanges {

  commonService = inject(CommonService);
  @Input() value: number | null = null;
  @Input() tooltipText: string = '';
  @Input() sign: string = '';

  formattedValue: string = '';
  circumference: number = 2 * Math.PI * 20;
  dashOffset: number = 0;

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.value === null || isNaN(this.value)) {
      this.formattedValue = 'NA';
      return;
    }

    const val = Number(this.value);
    this.formattedValue = val == 100 || val == 0 ? val.toFixed(0) : val.toFixed(2);

    // Calculate dash offset for animation
    const progress = val / 100;
    this.dashOffset = this.circumference * (1 - progress);
  }

  getColor(value: number): string {
    const colors = this.commonService.PillarColors;

    if (value >= 90) return colors[0];
    else if (value >= 80) return colors[1];
    else if (value >= 70) return colors[2];
    else if (value >= 60) return colors[3];
    else if (value >= 50) return colors[4];
    else if (value >= 40) return colors[5];
    else if (value >= 30) return colors[6];
    else if (value >= 20) return colors[7];
    else if (value >= 10) return colors[8];
    else return colors[9];
  }
  getColorR(value: number): string {
    const colors = this.commonService.PillarColors;

    if (value >= 80) return colors[5];
    else if (value >= 60) return colors[4];
    else if (value >= 40) return colors[3];
    else return colors[1];
  }
}
