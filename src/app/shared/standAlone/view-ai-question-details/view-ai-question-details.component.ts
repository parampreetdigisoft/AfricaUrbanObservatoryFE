import { Component, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';


import { CommonModule } from '@angular/common';
import { TypingTextComponent } from 'src/app/shared/standAlone/typing-text/typing-text.component';

import { AiCityPillarVM } from 'src/app/core/models/aiVm/AiCityPillarResponseDto';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { AITrustLevelVM } from 'src/app/core/models/aiVm/AITrustLevelVM';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AIEstimatedQuestionScoreDto } from 'src/app/core/models/aiVm/AIEstimatedQuestionScoreDto';

@Component({
  selector: 'app-view-ai-question-details',
  standalone: true,
  imports: [CommonModule, TypingTextComponent, CircularScoreComponent, SparklineScoreComponent, MatTooltipModule],

  templateUrl: './view-ai-question-details.component.html',
  styleUrl: './view-ai-question-details.component.css'
})
export class ViewAiQuestionDetailsComponent {
  @Input() question?: AIEstimatedQuestionScoreDto | null = null;
  @Input() aiTrustLevels: AITrustLevelVM[]=[];
  @Output() closeSidebar?: boolean | null = null;
  urlBase = environment.apiUrl;

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  getLabelById(id: number) {
    let tl = this.aiTrustLevels?.find(x => x.trustValue == id)
    return tl?.trustName ?? 'NA'
  }
  getLabelDesById(id: number) {
    let tl = this.aiTrustLevels?.find(x => x.trustValue == id)
    return (tl?.trustDescription ?? tl?.trustName) ?? 'NA'
  }
}
