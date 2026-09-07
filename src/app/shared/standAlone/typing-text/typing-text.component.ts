import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-typing-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-text.component.html',
  styleUrls: ['./typing-text.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypingTextComponent implements OnDestroy, OnChanges {

  @Input() text: string = '';
  @Input() speed: number = 40;
  @Input() numberOfWordAfterHideText: number = 7;

  displayedText: string = '';
  isExpanded: boolean = false;
  shouldShowToggle: boolean = false;
  isTypingCompleted: boolean = false;

  private intervalId: any = null;
  private typingStopIndex: number = 0;
  private limitedText: string = '';
  private fullText: string = '';
  private wasFullyTypedOnce: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Only restart typing if text actually changed
    if (changes['text'] && changes['text'].currentValue !== changes['text'].previousValue) {
      this.resetAndStartTyping();
    }
  }

  /**
   * Complete reset of component state
   */
  private resetAndStartTyping(): void {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Reset all state variables
    this.displayedText = '';
    this.isExpanded = false;
    this.shouldShowToggle = false;
    this.isTypingCompleted = false;
    this.typingStopIndex = 0;
    this.limitedText = '';
    this.fullText = '';
    this.wasFullyTypedOnce = false;

    // Validate input before starting
    if (!this.text || this.text.trim() === '') {
      this.isTypingCompleted = true;
      this.cdr.markForCheck();
      return;
    }

    // Start typing animation
    this.startInitialTyping();
  }

  /**
   * Initial typing until word limit exceeded
   */
  private startInitialTyping(): void {
    let index = 0;

    this.intervalId = setInterval(() => {
      // Safety check
      if (!this.text || index >= this.text.length) {
        this.finishTyping();
        return;
      }

      this.displayedText += this.text[index];
      index++;

      // Check word count
      const words = this.displayedText.trim().split(/\s+/);

      if (words.length > this.numberOfWordAfterHideText) {
        this.shouldShowToggle = true;
        clearInterval(this.intervalId);
        this.intervalId = null;

        // Create limited text
        this.limitedText = words.slice(0, this.numberOfWordAfterHideText).join(' ') + '...';
        this.displayedText = this.limitedText;
        this.typingStopIndex = index;
        this.isTypingCompleted = true;

        this.cdr.markForCheck();
        return;
      }

      // Check if finished
      if (index >= this.text.length) {
        this.finishTyping();
      }

      this.cdr.markForCheck();
    }, this.speed);
  }

  /**
   * Lazy typing when user clicks "Show More" the first time
   */
  private startLazyTyping(): void {
    // Safety check
    if (!this.text) {
      this.finishTyping();
      return;
    }

    let index = Math.max(0, this.typingStopIndex - 3);
    this.displayedText = this.displayedText.slice(0, -Math.min(4, this.displayedText.length));

    this.intervalId = setInterval(() => {
      // Safety check
      if (!this.text || index >= this.text.length) {
        this.finishTyping();
        return;
      }

      this.displayedText += this.text[index];
      index++;

      if (index >= this.text.length) {
        this.finishTyping();
      }

      this.cdr.markForCheck();
    }, this.speed);
  }

  /**
   * Finish typing and store full text
   */
  private finishTyping(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isTypingCompleted = true;
    this.fullText = this.text;
    this.wasFullyTypedOnce = true;
    this.cdr.markForCheck();
  }

  /**
   * Toggle between expanded and collapsed states
   */
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      // SHOW MORE
      if (this.wasFullyTypedOnce) {
        // Already typed before - instant display
        this.displayedText = this.fullText;
        this.isTypingCompleted = true;
        this.cdr.markForCheck();
      } else {
        // Type remaining text with animation
        this.isTypingCompleted = false;
        this.startLazyTyping();
      }
    } else {
      // SHOW LESS
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.displayedText = this.limitedText;
      this.isTypingCompleted = true;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}