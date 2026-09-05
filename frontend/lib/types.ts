export type ValidationStatus = 'VERIFIED' | 'WARNING' | 'FAILED';

export interface EvidenceObject {
  question?: string;
  source?: string;
  tool?: string;
  filters?: Record<string, any>;
  calculation?: string;
  result?: any;
  recordCount?: number;
  validationStatus: ValidationStatus;
  validationNotes?: string[];
  timestamp?: string;
}

export interface ChatResponse {
  answer: string;
  evidence?: EvidenceObject;
  provider?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidence?: EvidenceObject;
  provider?: string;
  timestamp: Date;
  isError?: boolean;
}

export interface HealthResponse {
  backend: string;
  mcp: string;
  database: string;
  llm: string;
  aiProvider: string;
  version?: string;
  details?: Record<string, any>;
}

export interface BreakdownColumn {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'badge' | 'text' | 'number';
}