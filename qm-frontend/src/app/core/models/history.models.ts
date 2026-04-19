/** API-aligned history entry (newest first from GET). */
export interface HistoryEntryDto {
  id: string;
  createdAt: string;
  measurementType: string;
  operation: string;
  expression: string;
  resultSummary: string;
}

export interface SaveHistoryRequestDto {
  measurementType: string;
  operation: string;
  expression: string;
  resultSummary: string;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}
