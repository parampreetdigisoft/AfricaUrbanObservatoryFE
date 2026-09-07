export interface ResultResponseDto<T = any> {
  succeeded: boolean;
  result: T | null;
  errors: string[];
  messages: string[];
  returnId: number | null;
  isExist: boolean | null;
}