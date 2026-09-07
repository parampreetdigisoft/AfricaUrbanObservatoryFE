export interface AIAssistantFAQDto {
  faqid: number;
  related: string;
  category: string;
  questionText: string;
  answerText?: string | null;
  displayOrder: number;
  isAnsweredFaq: boolean;
}