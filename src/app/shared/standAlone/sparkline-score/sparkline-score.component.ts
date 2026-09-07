import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonService } from 'src/app/core/services/common.service';

@Component({
  selector: 'app-sparkline-score',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './sparkline-score.component.html',
  styleUrl: './sparkline-score.component.css'
})
export class SparklineScoreComponent implements OnInit, OnChanges {

  @Input() value: number | null = null;
  @Input() tooltipText: string = '';
  @Input() sign: string ="%"
  commonService = inject(CommonService);
  formattedValue: string = '';

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.value === null || isNaN(this.value)) {
      this.formattedValue = 'NA';
      return;
    }

    const val = Number(this.value);
    this.formattedValue = val == 100 ? val.toFixed(0) : val.toFixed(2);
  }
  getColor(value: number): string {
    const colors = this.commonService.PillarColors;

    if (value >= 90) return colors[9];
    else if (value >= 80) return colors[8];
    else if (value >= 70) return colors[7];
    else if (value >= 60) return colors[6];
    else if (value >= 50) return colors[5];
    else if (value >= 40) return colors[4];
    else if (value >= 30) return colors[3];
    else if (value >= 20) return colors[2];
    else if (value >= 10) return colors[1];
    else return colors[0];
  }

}
