export interface AnomalyAlert {
  id: string;
  type: 'SPEND_SPIKE' | 'DUPLICATE' | 'UNMATCHED_RECONCILIATION' | 'UNAPPROVED_TRANCHE';
  severity: 'high' | 'medium' | 'low';
  vendor_name: string;
  amount: number;
  expected_amount?: number;
  deviation_percentage?: number;
  message: string;
  record_id: string;
  date: string;
}

export interface ExplainabilityTrace {
  query_intent: string;
  sql_executed: string;
  parameters: any[];
  records_evaluated: number;
  computation_steps: string[];
  date_range_applied?: {
    start: string;
    end: string;
    label: string;
  };
  filters_applied: Record<string, any>;
  data_sources: string[];
}

export interface BreakdownColumn {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'badge' | 'text' | 'number';
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  query: string;
  summary: string;
  metrics?: {
    total_amount?: number;
    count?: number;
    average?: number;
    comparison_amount?: number;
    delta_amount?: number;
    delta_percentage?: number;
    reconciliation_rate?: number;
  };
  breakdown: {
    columns: BreakdownColumn[];
    rows: any[];
    total_rows: number;
    export_filename: string;
  };
  explainability: ExplainabilityTrace;
  confidence: {
    score: number;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  };
  anomalies?: AnomalyAlert[];
  guardrail_triggered: boolean;
  guardrail_message?: string;
  follow_up_suggestions: string[];
  model_info?: {
    name: string;
    type: string;
    latency_ms: number;
    is_lightweight: boolean;
  };
}

export interface DashboardStats {
  total_spend_ytd: number;
  last_month_payouts: number;
  previous_month_payouts: number;
  month_over_month_change_pct: number;
  reconciliation_rate: number;
  unreconciled_count: number;
  unreconciled_amount: number;
  active_vendors_count: number;
  monthly_trend: Array<{
    month: string;
    month_name: string;
    total_payouts: number;
    reconciled_amount: number;
    unreconciled_amount: number;
  }>;
  category_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  top_vendors: Array<{
    vendor_id: string;
    name: string;
    category: string;
    total_spend: number;
    payout_count: number;
  }>;
  recent_anomalies: AnomalyAlert[];
}
