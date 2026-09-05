export type ValidationStatus = 'VERIFIED' | 'WARNING' | 'FAILED';

export interface Citation {
  sourceId: string;
  date: string;
  amount: string;
  ref: string;
}

export interface ModelEfficiency {
  model: string;
  latencyMs: number;
  tokensUsed: number;
  costEstimateUsd: number;
}

export interface EvidenceDetail {
  isVerified: boolean;
  toolExecuted: string;
  sqlQuery?: string;
  executionTimeMs: number;
  recordsCount: number;
  citations: Citation[];
  modelEfficiency: ModelEfficiency;
}

export interface ConfidenceInfo {
  score: number;
  grade: 'HIGH' | 'MEDIUM' | 'LOW';
  badgeText: string;
  disclaimer: string | null;
}

export interface AnomalyInfo {
  detected: boolean;
  alertMessage: string;
}

export interface Answer {
  headline: string;
  breakdownSummary: string;
}

export interface FinancialResponse {
  conversationId: string;
  traceId: string;
  langfuseUrl: string;
  answer: Answer;
  confidence: ConfidenceInfo;
  anomaly: AnomalyInfo | null;
  evidence: EvidenceDetail;
  records: Record<string, any>[];
}

// Legacy support
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
  financialResponse?: FinancialResponse;
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

export interface AccountRecord {
  account_id: string;
  account_number_masked: string;
  bank_code: string;
  bank_name: string;
  available_balance: number;
  calculated_ledger_balance?: number;
  discrepancy?: number;
}

export interface TransactionRecord {
  transaction_id: string;
  account_number_masked: string;
  bank_code: string;
  bank_name: string;
  transaction_date: string;
  transaction_type: 'credit' | 'debit';
  transaction_amount: number;
  description: string;
  transaction_reference_id: string;
}
