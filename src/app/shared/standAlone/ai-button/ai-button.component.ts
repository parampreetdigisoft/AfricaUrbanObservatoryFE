import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-button',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './ai-button.component.html',
  styleUrl: './ai-button.component.css'
})
export class AiButtonComponent {

  @Input() isAiViewEnabled: boolean = false;
  @Output() onAiViewToggle =  new EventEmitter();


  aiViewToggle(event:any){
    this.onAiViewToggle.emit(event)
  }
}
