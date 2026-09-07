
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatContext {
  city?: string;
  pillar?: string;
}

export interface CityChatRequestDto extends GlobalChatRequestDto {
  cityID: number;
  pillarID?: number | null;
  questionText: string;
  fAQID?: number | null;
  historyText: string | null;
}

export interface GlobalChatRequestDto {
  questionText: string;
  fAQID?: number | null;
  historyText: string | null;
}

export interface CrossComparisionChatRequestDto {
  questionText: string;
  cityIDs: number[];
  historyText: string | null;
}

export interface ChatResponseDto {
  cityID: number;
  pillarID?: number | null;
  questionText: string;
  fAQID?: number | null;
  responseText: string;
}