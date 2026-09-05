import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw, 
  Database,
  ArrowRight,
  Clock,
  CheckCircle2,
  Table as TableIcon,
  Maximize2,
  X
} from 'lucide-react';
import type { ChatResponse } from '../types';
import { exportToCSV, exportToExcel } from '../utils/csv';

interface ChatBotProps {
  initialQuery?: string;
  customApiKey?: string;
  onClearInitialQuery?: () => void;
  isDrawer?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responsePayload?: ChatResponse;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  { label: 'Last Month Payouts', query: 'How much did we spend on vendor payouts last month?' },
  { label: 'Unreconciled Txns', query: 'Which transactions are still unreconciled?' },
  { label: 'Compare MoM', query: 'How does that compare to the month before?' },
  { label: 'Flag Anomalies', query: 'Flag any abnormal or unusually high vendor payouts' },
  { label: 'Top 5 Vendors', query: 'Show me top 5 vendors by spend' },
  { label: 'Spend by Category', query: 'Breakdown payouts by category' },
  { label: 'Guardrail Test', query: 'What did we spend on Mars Exploration Inc?' },
];

export const ChatBot: React.FC<ChatBotProps> = ({
  initialQuery,
  customApiKey,
  onClearInitialQuery,
  isDrawer = false,
  onClose,
  onExpand,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to **FinGrounded AI**. I am your grounded financial assistant connected directly to your enterprise transactions, vendor payouts, and reconciliation ledger. Every answer is deterministically pre-computed and verifiable against source records.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputText).trim();
    if (!text || loading) return;

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!queryToSend) setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          conversation_id: conversationId || undefined,
          api_key: customApiKey || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer from financial assistant.');
      }

      const data: ChatResponse = await res.json();
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: MessageItem = {
        id: data.message_id || `asst-${Date.now()}`,
        role: 'assistant',
        content: data.summary,
        responsePayload: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error processing query: ${err.message || 'Unable to connect to backend.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Session refreshed. You can ask routine financial queries, verify reconciliations, or compare month-over-month variances.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setConversationId('');
  };

  const toggleTrace = (id: string) => {
    setExpandedTraceId(prev => (prev === id ? null : id));
  };

  return (
    <div className={
      isDrawer
        ? "flex flex-col h-full bg-white overflow-hidden"
        : "max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
    }>
      {/* Assistant Header */}
      <div className={`p-3.5 ${isDrawer ? 'px-4' : 'px-6'} border-b border-slate-200 bg-slate-100 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {isDrawer ? 'AI Finance Assistant' : 'Financial Intelligence Assistant'}
              </h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                100% Grounded
              </span>
            </div>
            {!isDrawer && (
              <p className="text-xs text-slate-500 truncate">
                Deterministic SQL calculation layer • Verified against transactions & vendor payouts
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReset}
            title="Reset Conversation"
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className={isDrawer ? "hidden sm:inline" : ""}>New Session</span>
          </button>
          {onExpand && (
            <button
              onClick={onExpand}
              title="Expand to Full AI Assistant View"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Close Popup"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Message Bubble */}
            <div className={`max-w-4xl rounded-2xl p-4 sm:p-5 shadow-xs ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-4'
            }`}>
              {/* Plain Language Answer */}
              <div className="prose prose-slate prose-sm max-w-none">
                <div 
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />') 
                  }} 
                />
              </div>

              {/* Guardrail Callout if Triggered */}
              {msg.responsePayload?.guardrail_triggered && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hallucination Guardrail Enforced: </span>
                    <span>No ungrounded assumptions or synthetic numbers are generated when records are missing.</span>
                  </div>
                </div>
              )}

              {/* Anomaly Callout Banner */}
              {msg.responsePayload?.anomalies && msg.responsePayload.anomalies.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Financial Anomaly Flagged ({msg.responsePayload.anomalies.length} detected)</span>
                  </div>
                  {msg.responsePayload.anomalies.map(anm => (
                    <div key={anm.id} className="text-rose-700 pl-5 leading-tight">
                      • {anm.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Key Computed Metrics Card */}
              {msg.responsePayload?.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {msg.responsePayload.metrics.total_amount !== undefined && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Computed Total</div>
                      <div className="text-sm font-bold text-slate-900">
                        ${msg.responsePayload.metrics.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                  {msg.responsePayload.metrics.count !== undefined && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Records Count</div>
                      <div className="text-sm font-bold text-slate-900">
                        {msg.responsePayload.metrics.count} rows
                      </div>
                    </div>
                  )}
                  {msg.responsePayload.metrics.average !== undefined && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Mean / Payout</div>
                      <div className="text-sm font-bold text-slate-900">
                        ${msg.responsePayload.metrics.average.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                  {msg.responsePayload.metrics.delta_percentage !== undefined && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">MoM Variance</div>
                      <div className={`text-sm font-bold ${
                        msg.responsePayload.metrics.delta_percentage > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {msg.responsePayload.metrics.delta_percentage > 0 ? '+' : ''}
                        {msg.responsePayload.metrics.delta_percentage}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verifiable Data Breakdown Table */}
              {msg.responsePayload?.breakdown && msg.responsePayload.breakdown.rows.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Verifiable Records Breakdown ({msg.responsePayload.breakdown.total_rows} items)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => exportToCSV(
                          msg.responsePayload!.breakdown.columns,
                          msg.responsePayload!.breakdown.rows,
                          msg.responsePayload!.breakdown.export_filename.replace(/\.(csv|xls)$/i, '') + '.csv'
                        )}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => exportToExcel(
                          msg.responsePayload!.breakdown.columns,
                          msg.responsePayload!.breakdown.rows,
                          msg.responsePayload!.breakdown.export_filename.replace(/\.(csv|xls)$/i, '') + '.xls'
                        )}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-2xs"
                        title="Download Excel spreadsheet"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-left text-xs text-slate-600 border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0 font-semibold">
                        <tr>
                          {msg.responsePayload.breakdown.columns.map((col) => (
                            <th key={col.key} className="py-2 px-3 whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {msg.responsePayload.breakdown.rows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            {msg.responsePayload!.breakdown.columns.map((col) => {
                              const val = row[col.key];
                              if (col.format === 'currency') {
                                return (
                                  <td key={col.key} className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                    ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </td>
                                );
                              }
                              if (col.format === 'badge') {
                                return (
                                  <td key={col.key} className="py-2 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              return (
                                <td key={col.key} className="py-2 px-3 whitespace-nowrap max-w-xs truncate" title={String(val)}>
                                  {val !== null && val !== undefined ? String(val) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {msg.responsePayload.breakdown.rows.length > 10 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50/50 border-t border-slate-100">
                      Showing first 10 of {msg.responsePayload.breakdown.rows.length} rows. Use "Export CSV" for the full dataset.
                    </div>
                  )}
                </div>
              )}

              {/* Explainability & Grounding Trace (Accordion) */}
              {msg.responsePayload?.explainability && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => toggleTrace(msg.id)}
                    className="w-full p-2.5 px-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      <span>Explainability & Grounding Audit Trace</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        (Deterministic SQL query & computation steps)
                      </span>
                    </div>
                    {expandedTraceId === msg.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {expandedTraceId === msg.id && (
                    <div className="p-4 space-y-3 bg-white border-t border-slate-100 text-xs">
                      <div>
                        <div className="font-bold text-slate-700 mb-1">SQL Query Executed:</div>
                        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {msg.responsePayload.explainability.sql_executed}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">Pre-computation Reasoning Steps:</div>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {msg.responsePayload.explainability.computation_steps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                        <span>Records Evaluated: <strong>{msg.responsePayload.explainability.records_evaluated}</strong></span>
                        <span>• Data Sources: <strong>{msg.responsePayload.explainability.data_sources.join(', ')}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confidence Signalling & Model Efficiency Badge */}
              {msg.responsePayload && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {msg.responsePayload.confidence.score}% Grounded Confidence
                    </span>
                    <span className="text-slate-400">• {msg.responsePayload.confidence.reason}</span>
                  </div>

                  {msg.responsePayload.model_info && (
                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{msg.responsePayload.model_info.name} ({msg.responsePayload.model_info.latency_ms}ms)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up Suggestions Pills */}
              {msg.responsePayload?.follow_up_suggestions && msg.responsePayload.follow_up_suggestions.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Follow-ups:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.responsePayload.follow_up_suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>{sug}</span>
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Timestamp */}
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-slate-600 font-medium animate-pulse">
                Parsing financial intent, compiling exact SQL aggregate & calculating baseline stats...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className={`p-2.5 ${isDrawer ? 'px-3' : 'px-6'} bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar`}>
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" /> Try:
        </span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sample.query)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full text-[11px] bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 border border-slate-200 whitespace-nowrap transition-all shadow-2xs"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`p-3 ${isDrawer ? 'px-3' : 'px-6'} border-t border-slate-200 bg-white flex items-center gap-2.5`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isDrawer ? "Ask financial question..." : "Ask a financial question (e.g. 'How much did we spend on vendor payouts last month?')"}
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
