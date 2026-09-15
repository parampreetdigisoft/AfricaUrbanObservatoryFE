import { computed, Injectable, signal } from '@angular/core';
import { Observable, interval, Subject, takeUntil, BehaviorSubject, map, Subscription } from 'rxjs';
import {
  ChatMessage,
  ChatResponseDto,
  CityChatRequestDto,
  CrossComparisionChatRequestDto,
  GlobalChatRequestDto,

} from '../models/chat/ChatMessage';
import { UserService } from './user.service';

import { PillarsVM } from '../models/PillersVM';
import { HttpService } from '../http/http.service';
import { ToasterService } from './toaster.service';
import { ResultResponseDto } from '../models/ResultResponseDto';
import { AIAssistantFAQDto } from '../models/chat/AIAssistantFAQDto';
import { CityVM } from '../models/CityVM';
import { ChatCityExecutiveSlidesResponse, CityExecutiveSlidesResult } from '../models/chat/ChatCityExecutiveSlidesResponse';
import { ChatEmergingTrendsResponse } from '../models/chat/EmergingTrendsResponse';
import { PillarLiveSignalsResult } from '../models/chat/PillarLiveSignalsResponse';

@Injectable({ providedIn: 'root' })
export class ChatService {
  // ─── State ────────────────────────────────────────────────────────────────
  isOpen = signal(false);
  isTyping = signal(false);
  selectedCity = signal<CityVM | null>(null);
  selectedPillar = signal<PillarsVM | null>(null);
  messages = signal<ChatMessage[]>([]);
  cities = new BehaviorSubject<CityVM[]>([]);
  pillars = new BehaviorSubject<PillarsVM[]>([]);
  faqs = new BehaviorSubject<AIAssistantFAQDto[]>([]);
  selectedfaq = signal<AIAssistantFAQDto | null>(null);
   crossComparisionCityIDs = new BehaviorSubject<number[]>([]);
  quickQuestions = computed(() => this.selectedCity() ? this.cityQuickQuestions : this.globalQuickQuestions);
  // ─── Cancellation tokens ──────────────────────────────────────────────────
  /**
   * Emitting on cancelStream$ stops an active typewriter interval via takeUntil.
   * A new Subject is created per sendMessage() call so old ones don't interfere.
   */
  private cancelStream$ = new Subject<void>();
  /**
   * Holds the active HTTP subscription so it can be aborted before the API
   * responds (the "API in flight" path in the cancel flow).
   */
  private activeRequest$: Subscription | null = null;
  /**
   * Keeps the full text that the backend returned so that stopGeneration()
   * can flush it instantly instead of discarding the answer.
   */
  private pendingFullText = '';
  private pendingAssistantId = '';

  // ─── Welcome message ──────────────────────────────────────────────────────
  private readonly welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `## Welcome to African Urban Index\n\nI'm your **Urban Intelligence Assistant**. I can help you analyze:\n\n- **City index scores** \n- **Pillar-level breakdowns** and risk factors\n- **Trends and recommendations**\n\nSelect a **city** and **pillar** above for focused insights, or ask me anything!`,
    timestamp: new Date(),
  };

  constructor(
    private http: HttpService,
    private userService: UserService,
    private toaster: ToasterService,
  ) {
    this.messages.set([this.welcomeMessage]);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  openWithContext(city?: CityVM, pillar?: PillarsVM): void {
    if (city) this.selectedCity.set(city);
    if (pillar) this.selectedPillar.set(pillar);
    this.isOpen.set(true);
  }

  toggleOpen(): void { this.isOpen.update(v => !v); }
  closeChat(): void { this.isOpen.set(false); }
  clearHistory(): void { this.messages.set([this.welcomeMessage]); }
  /**
   * Stop any active generation immediately.
   *
   * Two cases handled:
   *  1. API still in flight → abort the HTTP request, show a cancelled notice.
   *  2. Typewriter animation running → flush the full response text instantly.
   */
  stopGeneration(): void {
    if (!this.isTyping()) return;

    if (this.activeRequest$ && !this.activeRequest$.closed) {
      // ── Case 1: API hasn't responded yet ──────────────────────────────────
      this.activeRequest$.unsubscribe();
      this.activeRequest$ = null;

      this.updateAssistantMessage(
        this.pendingAssistantId,
        '_Stopped._',
        false,
      );
      this.finalizeMessage(this.pendingAssistantId);
      this.isTyping.set(false);
    } else {
      // ── Case 2: Typewriter animation is running ───────────────────────────
      // Emit cancel so takeUntil inside typewriterStream() tears down the interval.
      this.cancelStream$.next();

      // Flush whatever text the backend returned (already stored in pendingFullText).
      if (this.pendingAssistantId) {
        this.updateAssistantMessage(this.pendingAssistantId, this.pendingFullText, false);
        this.finalizeMessage(this.pendingAssistantId);
      }
      this.isTyping.set(false);
    }

    // Reset pending state
    this.pendingFullText = '';
    this.pendingAssistantId = '';
  }

  /** Return top-4 predefined question matches for a user query. */
  filterQuestions(query: string): AIAssistantFAQDto[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    if (this.selectedCity()) {
      return this.faqs.value
        .filter(pq => pq.questionText.toLowerCase().includes(q) && !pq.related.includes('global'))
        .slice(0, 4);
    } else {
      return this.faqs.value
        .filter(pq => pq.questionText.toLowerCase().includes(q) && pq.related.includes('global'))
        .slice(0, 4);
    }
  }

  /**
   * Send a user message and return an Observable that emits growing streamed text.
   *
   * Calling this while a previous message is still generating will automatically
   * call stopGeneration() first, so the UI never has two concurrent streams.
   */
  sendMessage(userText: string): Observable<string> {
    // Auto-cancel any in-progress generation before starting a new one.
    if (this.isTyping()) {
      this.stopGeneration();
    }

    // New cancel token per message
    this.cancelStream$ = new Subject<void>();

    const city = this.selectedCity();
    const pillar = this.selectedPillar();
    const histories = this.messages()
      .slice(1)
      .slice(-3)
      .map(msg => {
        const content =
          msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content;

        return `${msg.role}: ${content}`;
      }).join('\n');

    // Add user message
    const userMsg: ChatMessage = {
      id: this.uid(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.isTyping.set(true);

    return new Observable<string>(observer => {
      const assistantId = this.uid();
      this.pendingAssistantId = assistantId;

      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      this.messages.update(msgs => [...msgs, placeholder]);

      if (city) {
        const payload: CityChatRequestDto = {
          cityID: city.cityID,
          pillarID: pillar?.pillarID ?? 0,
          questionText: userText,
          fAQID: this.selectedfaq()?.faqid,
          historyText: histories,
        };

        this.activeRequest$ = this.askAboutCity(payload).subscribe({
          next: res => {
            this.activeRequest$ = null; // HTTP done; typewriter phase begins

            if (res.succeeded) {
              const fullText = res.result?.responseText ?? '';
              this.pendingFullText = fullText;
              this.typewriterStream(fullText, assistantId, observer);
            } else {
              this.handleError(assistantId, observer, res.errors?.join(', ') ?? 'Unknown error');
            }
          },
          error: () => {
            this.activeRequest$ = null;
            this.handleError(assistantId, observer, 'Request failed. Please try again.');
          },
        });
      } else {
        const payload: GlobalChatRequestDto = {
          questionText: userText,
          fAQID: this.selectedfaq()?.faqid,
          historyText: histories,
        };

        this.activeRequest$ = this.askGlobalQuestion(payload).subscribe({
          next: res => {
            this.activeRequest$ = null; // HTTP done; typewriter phase begins

            if (res.succeeded) {
              const fullText = res.result?.responseText ?? '';
              this.pendingFullText = fullText;
              this.typewriterStream(fullText, assistantId, observer);
            } else {
              this.handleError(assistantId, observer, res.errors?.join(', ') ?? 'Unknown error');
            }
          },
          error: () => {
            this.activeRequest$ = null;
            this.handleError(assistantId, observer, 'Request failed. Please try again.');
          },
        });
      }
    });
  }

  // ─── Data fetches ─────────────────────────────────────────────────────────

  getFAQDs(): void {
    if (this.faqs.value.length > 0) return;
    this.getAssistantFAQDs().subscribe({
      next: res => this.faqs.next(res.result ?? []),
    });
  }

  getAllCites(): void {
    if (this.cities.value.length > 0) return;
    this.getAllCitiesByUserId(this.userService?.userInfo?.userID).subscribe({
      next: res => this.cities.next(res.result ?? []),
    });
  }

  getPillars(): void {
    if (this.pillars.value.length > 0) return;
    this.getAllPillars().subscribe({
      next: res => this.pillars.next(res ?? []),
    });
  }


  getCitySlides(
    cityId: number
  ): Observable<ResultResponseDto<ChatCityExecutiveSlidesResponse>> {

    return this.http.post<ResultResponseDto<ChatCityExecutiveSlidesResponse>>(
      `Chat/citySlides`,
      cityId as any
    );
  }



  // ─── Private helpers ──────────────────────────────────────────────────────

  private typewriterStream(
    fullText: string,
    assistantId: string,
    observer: { next(v: string): void; complete(): void },
  ): void {
    let i = 0;
    const speed = 8; // ms per character

    interval(speed)
      .pipe(takeUntil(this.cancelStream$)) // ← torn down by stopGeneration()
      .subscribe({
        next: () => {
          i++;
          const chunk = fullText.substring(0, i);
          this.updateAssistantMessage(assistantId, chunk, true);
          observer.next(chunk);

          if (i >= fullText.length) {
            this.cancelStream$.next();   // self-complete
            this.finalizeMessage(assistantId);
            this.isTyping.set(false);
            this.pendingFullText = '';
            this.pendingAssistantId = '';
            observer.complete();
          }
        },
      });
  }

  private handleError(
    assistantId: string,
    observer: { next(v: string): void; complete(): void },
    message: string,
  ): void {
    this.toaster.showError(message);
    this.updateAssistantMessage(assistantId, `⚠️ ${message}`, false);
    this.finalizeMessage(assistantId);
    this.isTyping.set(false);
    this.pendingFullText = '';
    this.pendingAssistantId = '';
    observer.complete();
  }

  private updateAssistantMessage(id: string, content: string, isStreaming: boolean): void {
    this.messages.update(msgs =>
      msgs.map(m => m.id === id ? { ...m, content, isStreaming } : m)
    );
  }

  private finalizeMessage(id: string): void {
    this.messages.update(msgs =>
      msgs.map(m => m.id === id ? { ...m, isStreaming: false } : m)
    );
  }

  private uid(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }


  // ─── HTTP ─────────────────────────────────────────────────────────────────

  private getAllCitiesByUserId(userId: number) {
    return this.http
      .get(`City/getAllCityByUserId/${userId}`)
      .pipe(map(x => x as ResultResponseDto<CityVM[]>));
  }

  private getAllPillars() {
    return this.http
      .get('Pillar/Pillars')
      .pipe(map(x => x as PillarsVM[]));
  }

  private getAssistantFAQDs() {
    return this.http
      .get('chat/getAssistantFAQDs')
      .pipe(map(x => x as ResultResponseDto<AIAssistantFAQDto[]>));
  }

  private askAboutCity(request: CityChatRequestDto) {
    return this.http
      .post('chat/askAboutCity', request)
      .pipe(map(x => x as ResultResponseDto<ChatResponseDto>));
  }

  private askGlobalQuestion(request: GlobalChatRequestDto) {
    return this.http
      .post('chat/askglobalQuestion', request)
      .pipe(map(x => x as ResultResponseDto<ChatResponseDto>));
  }
  cityQuickQuestions = [
    {
      label: 'Overview',
      question: 'Provide an overall summary of this city’s current performance in the African Urban Index.'
    },
    {
      label: 'Strengths',
      question: 'What are the major strengths and positive developments observed in this city across urban development indicators?'
    },
    {
      label: 'Challenges',
      question: 'What are the most critical urban challenges or risks currently affecting this city?'
    },
        
    {
      label: 'Governance & capacity',
      question: 'How effective are the city’s governance systems, institutional capacity, and implementation mechanisms?'
    },
    {
      label: 'Equity & sustainability',
      question: 'How does this city perform in terms of inclusiveness, sustainability, and long-term urban resilience?'
    }
  ];


  // Questions for all countries globally
  globalQuickQuestions = [
    {
      label: 'Overview',
      question: 'Provide a global overview of recent trends and performance across cities in the African Urban Index.'
    },
    {
      label: 'Top cities',
      question: 'Which cities are currently demonstrating the strongest overall performance across urban development indicators?'
    },
    {
      label: 'Critical risks',
      question: 'What are the most significant urban risks and challenges currently affecting african cities?'
    },
    
    {
      label: 'Most improved',
      question: 'Which cities have shown the greatest improvement in their African Urban Index performance recently?'
    },
    {
      label: 'High-risk',
      question: 'Which cities are currently facing the highest levels of urban vulnerability, governance challenges, or sustainability risks?'
    },
    {
      label: 'Urban trends',
      question: 'What are the latest global urban development trends, cross-city patterns, and emerging priorities?'
    }
    
  ];

  getCitiesCrossComparision() {
    let userText = "Provide a detailed comparative analysis of the selected cities across all urban performance pillars, including key risks, development opportunities, structural vulnerabilities, resilience indicators, emerging urban trends, and strategic observations for each pillar."

    if (this.isTyping()) {
      this.stopGeneration();
    }

    this.cancelStream$ = new Subject<void>();

    const histories = this.messages()
      .slice(1)
      .slice(-3)
      .map(msg => {
        const content =
          msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content;

        return `${msg.role}: ${content}`;
      }).join('\n');

    // Add user message
    const userMsg: ChatMessage = {
      id: this.uid(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.isTyping.set(true);

    return new Observable<string>(observer => {
      const assistantId = this.uid();
      this.pendingAssistantId = assistantId;

      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      this.messages.update(msgs => [...msgs, placeholder]);

      if (this.crossComparisionCityIDs.value.length > 0) {
        const payload: CrossComparisionChatRequestDto = {
          cityIDs: this.crossComparisionCityIDs.value,
          questionText: userText,
          historyText: histories,
        };

        this.activeRequest$ = this.crossComparisionquestion(payload).subscribe({
          next: res => {
            this.activeRequest$ = null; // HTTP done; typewriter phase begins

            if (res.succeeded) {
              const fullText = res.result?.responseText ?? '';
              this.pendingFullText = fullText;
              this.typewriterStream(fullText, assistantId, observer);
            } else {
              this.handleError(assistantId, observer, res.errors?.join(', ') ?? 'Unknown error');
            }
          },
          error: () => {
            this.activeRequest$ = null;
            this.handleError(assistantId, observer, 'Request failed. Please try again.');
          },
        });
      }
    });
  }

  private crossComparisionquestion(request: CrossComparisionChatRequestDto) {
    return this.http
      .post('chat/crossComparision', request)
      .pipe(map(x => x as ResultResponseDto<ChatResponseDto>));
  }

   getEmergingTrendsAndIssues(cityCount = 6): Observable<ResultResponseDto<ChatEmergingTrendsResponse>> {
    return this.http
      .getWithQueryParams('Public/emergingTrendsAndIssues', { cityCount })
      .pipe(map(x => x as ResultResponseDto<ChatEmergingTrendsResponse>));
  }

  getPillarLiveSignals(): Observable<ResultResponseDto<PillarLiveSignalsResult>> {
    return this.http
      .get('Public/pillarLiveSignals')
      .pipe(map(x => x as ResultResponseDto<PillarLiveSignalsResult>));
  }
}