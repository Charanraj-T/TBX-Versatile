"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, RotateCcw, Bot, User, AlertCircle, Loader2, Mic, Download, FileSpreadsheet, Table as TableIcon } from "lucide-react";
import type { ChatMessage, BreakdownColumn } from "../lib/types";
import { sendChatMessage, transcribeAudio, resetConversation } from "../lib/api";
import { EvidenceCard } from "./EvidenceCard";
import { exportToCSV, exportToExcel } from "../lib/csv";

export interface QueryModeFilters {
  startDate?: string;
  endDate?: string;
  typeFilter?: string;
  searchQuery?: string;
}

interface ChatBotProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onNavigateToQueryMode?: (filters: QueryModeFilters) => void;
}

function getMonthDateRange(monthStr: string): { start: string; end: string } | null {
  const parts = monthStr.split("-");
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  const start = `${parts[0]}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${parts[0]}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

const TRANSACTION_COLUMNS: BreakdownColumn[] = [
  { key: "index", label: "#", format: "number" },
  { key: "dateTime", label: "Date & Time", format: "text" },
  { key: "type", label: "Type", format: "badge" },
  { key: "amount", label: "Amount (₹)", format: "currency" },
  { key: "description", label: "Description", format: "text" },
  { key: "referenceId", label: "Reference ID", format: "text" },
];

function extractTransactions(msg: ChatMessage): any[] {
  // 1. Check financialResponse.records
  if (msg.financialResponse?.records && Array.isArray(msg.financialResponse.records) && msg.financialResponse.records.length > 0) {
    const first = msg.financialResponse.records[0];
    if (first && (first.transaction_id || first.transaction_date || first.transaction_type || first.transaction_amount || first.description)) {
      return msg.financialResponse.records.map((r, idx) => ({
        index: idx + 1,
        dateTime: r.transaction_date || r.date || "",
        type: r.transaction_type ? String(r.transaction_type).charAt(0).toUpperCase() + String(r.transaction_type).slice(1) : "",
        amount: r.transaction_amount ?? r.amount ?? "",
        description: r.description || "",
        referenceId: r.transaction_reference_id || r.reference_id || r.ref || "",
      }));
    }
  }

  // 2. Try parsing Markdown table in msg.content
  if (!msg.content) return [];
  const lines = msg.content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (tableLines.length >= 3) {
    const headerCells = tableLines[0]
      .split("|")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const hasTxnHeaders =
      headerCells.some((h) => h.includes("date") || h.includes("time")) &&
      headerCells.some((h) => h.includes("amount") || h.includes("₹") || h.includes("inr")) &&
      headerCells.some((h) => h.includes("type") || h.includes("desc") || h.includes("ref"));
    if (hasTxnHeaders) {
      const colIndices: { [key: string]: number } = {};
      headerCells.forEach((h, idx) => {
        if (h === "#" || h === "sl" || h === "no" || h === "id") colIndices.index = idx;
        else if (h.includes("date") || h.includes("time")) colIndices.dateTime = idx;
        else if (h.includes("type")) colIndices.type = idx;
        else if (h.includes("amount") || h.includes("₹") || h.includes("inr")) colIndices.amount = idx;
        else if (h.includes("desc")) colIndices.description = idx;
        else if (h.includes("ref")) colIndices.referenceId = idx;
      });

      const rows: any[] = [];
      for (let i = 2; i < tableLines.length; i++) {
        const cells = tableLines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 3) {
          const rawAmount = colIndices.amount !== undefined ? cells[colIndices.amount] || "" : "";
          const cleanAmount = rawAmount.replace(/[₹,\s]/g, "");
          const numAmount = !isNaN(Number(cleanAmount)) && cleanAmount !== "" ? Number(cleanAmount) : rawAmount;
          rows.push({
            index: colIndices.index !== undefined ? cells[colIndices.index] || rows.length + 1 : rows.length + 1,
            dateTime: colIndices.dateTime !== undefined ? cells[colIndices.dateTime] || "" : "",
            type: colIndices.type !== undefined ? cells[colIndices.type] || "" : "",
            amount: numAmount,
            description: colIndices.description !== undefined ? cells[colIndices.description] || "" : "",
            referenceId: colIndices.referenceId !== undefined ? cells[colIndices.referenceId] || "" : "",
          });
        }
      }
      if (rows.length > 0) return rows;
    }
  }

  return [];
}

const SUGGESTIONS: string[] = [
  "Show my recent transactions",
  "Show recent transactions for account 9069",
  "How many debit and credit transactions happened in May 2026?",
  "List all the banks I bank with",
  "What do my total debits and credits look like across all transactions?",
];

export const ChatBot: React.FC<ChatBotProps> = ({ initialQuery, onClearInitialQuery, onNavigateToQueryMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Hello! I\u2019m your FinOps assistant. Ask me anything about your money \u2014 recent transactions, monthly debits and credits, or your banks \u2014 and I\u2019ll pull verified answers from your financial ledger.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const hasUserMessage = messages.some((m) => m.role === "user");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSendMessage = async (preset?: string) => {
    const text = (preset || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!preset) setInputText("");
    setLoading(true);

    try {
      const data = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.answer.headline,
          evidence: data.evidence
            ? {
                tool: data.evidence.toolExecuted,
                filters: data.evidence.filters,
                recordCount: data.evidence.recordsCount,
                source: "PostgreSQL via Google MCP Toolbox",
                validationStatus: data.evidence.isVerified ? "VERIFIED" : "WARNING",
                validationNotes: data.confidence?.disclaimer ? [data.confidence.disclaimer] : undefined,
              }
            : undefined,
          provider: data.evidence?.modelEfficiency?.model,
          financialResponse: data,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${err.message || "Unable to connect to FinOps Backend API."}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    resetConversation();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      alert("Voice input is not supported in this browser. Please use a modern desktop browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);

        const blob = new Blob(mediaChunksRef.current, { type: mimeType });
        mediaChunksRef.current = [];
        if (blob.size === 0) return;

        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudio(blob);
          if (transcript.trim()) {
            await handleSendMessage(transcript.trim());
          } else {
            alert("No speech was detected. Please try again.");
          }
        } catch (err: any) {
          alert(err.message || "Could not transcribe your speech. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") stopRecording();
      }, 30000);
    } catch {
      setIsRecording(false);
      alert("Microphone access was denied or is unavailable. Please check browser permissions.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-3.5 px-6 border-b border-slate-200 bg-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">Financial Intelligence Assistant</h2>
            <p className="text-xs text-slate-500 truncate">Grounded answers from transactions & vendor payouts</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          title="Reset Conversation"
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <React.Fragment key={msg.id}>
              <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[80%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : msg.isError
                          ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none"
                          : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.isError && (
                      <div className="flex items-center gap-1.5 font-semibold text-rose-600 mb-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Error</span>
                      </div>
                    )}

                    {!isUser &&
                      (() => {
                        const txns = extractTransactions(msg);
                        if (txns.length === 0) return null;
                        return (
                          <div className="flex items-center justify-end gap-2 mb-3 pb-2 border-b border-slate-200/80">
                            <span className="text-[11px] font-medium text-slate-500 mr-auto">
                              {txns.length} transaction{txns.length === 1 ? "" : "s"}
                            </span>
                            <button
                              onClick={() => {
                                let start = "";
                                let end = "";
                                const month = msg.financialResponse?.evidence?.filters?.month;
                                if (month && typeof month === "string") {
                                  const range = getMonthDateRange(month);
                                  if (range) {
                                    start = range.start;
                                    end = range.end;
                                  }
                                }
                                if (!start || !end) {
                                  const dates = txns
                                    .map((t) => (t.dateTime ? String(t.dateTime).slice(0, 10) : ""))
                                    .filter((d) => d.length === 10)
                                    .sort();
                                  if (dates.length > 0) {
                                    start = dates[0];
                                    end = dates[dates.length - 1];
                                  }
                                }
                                const types = new Set(txns.map((t) => String(t.type).toLowerCase()));
                                const typeFilter = types.size === 1 ? (types.has("debit") ? "debit" : types.has("credit") ? "credit" : "all") : "all";
                                const vendor = msg.financialResponse?.evidence?.filters?.vendor_name;
                                onNavigateToQueryMode?.({
                                  startDate: start,
                                  endDate: end,
                                  typeFilter,
                                  searchQuery: typeof vendor === "string" ? vendor : "",
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                              title="View and explore in Query Mode with pre-selected filters"
                            >
                              <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>View Data</span>
                            </button>
                            <button
                              onClick={() => exportToCSV(TRANSACTION_COLUMNS, txns, `transactions_${Date.now()}.csv`)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                              title="Download transactions as CSV"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Export CSV</span>
                            </button>
                            <button
                              onClick={() => exportToExcel(TRANSACTION_COLUMNS, txns, `transactions_${Date.now()}.xls`)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                              title="Download transactions as Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                              <span>Export Excel</span>
                            </button>
                          </div>
                        );
                      })()}

                    <div className="leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-1">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong>{children}</strong>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2 rounded-xl border border-slate-200">
                              <table className="w-full text-xs border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => <td className="px-3 py-2 text-slate-700 border-b border-slate-100">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {!isUser && (msg.financialResponse || msg.evidence) && (
                      <EvidenceCard evidence={msg.evidence} financialResponse={msg.financialResponse} />
                    )}
                  </div>

                  <div className={`text-[10px] text-slate-400 px-1 ${isUser ? "text-right" : "text-left"}`}>
                    <span suppressHydrationWarning>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {msg.provider && !isUser && (
                      <span className="ml-1.5 font-mono text-[9px] uppercase px-1 rounded bg-slate-200 text-slate-600">{msg.provider}</span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>

              {msg.id === "welcome-msg" && !hasUserMessage && !loading && (
                <div className="flex flex-wrap gap-2 mt-1 ml-11">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-left flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/60 shadow-2xs transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Model is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 px-6 border-t border-slate-200 bg-white flex items-center gap-2.5"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a financial question (e.g. 'How much did we spend on vendor payouts last month?')"
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={loading || isTranscribing}
          title={isRecording ? "Stop recording" : "Voice input"}
          aria-label={isRecording ? "Stop recording" : "Voice input"}
          className={`p-2.5 sm:p-2.5 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center shrink-0 ${
            isRecording
              ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
              : isTranscribing
                ? "bg-slate-200 text-slate-500 cursor-wait"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600"
          }`}
        >
          {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </form>
    </div>
  );
};
