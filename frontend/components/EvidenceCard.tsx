"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Wrench,
  SlidersHorizontal,
  Database,
  FileCode,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { EvidenceObject, FinancialResponse } from "../lib/types";
import { ValidationBadge } from "./ValidationBadge";

interface EvidenceCardProps {
  evidence?: EvidenceObject;
  financialResponse?: FinancialResponse;
}

function formatArguments(filters?: Record<string, any>): string {
  if (!filters || Object.keys(filters).length === 0) return "";
  return Object.entries(filters)
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: (empty)`;
      if (typeof value === "object") return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${value}`;
    })
    .join("\n");
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, financialResponse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const toolName = financialResponse?.evidence?.toolExecuted || evidence?.tool || "N/A";
  const filters = financialResponse?.evidence?.filters || evidence?.filters;
  const sqlQuery = financialResponse?.evidence?.sqlQuery || evidence?.sqlQuery || evidence?.calculation;
  const recordCount = financialResponse?.evidence?.recordsCount ?? evidence?.recordCount ?? 0;
  const validationStatus = evidence?.validationStatus || (financialResponse?.evidence?.isVerified ? "VERIFIED" : "WARNING");
  const confidence = financialResponse?.confidence;
  const anomaly = financialResponse?.anomaly;
  const efficiency = financialResponse?.evidence?.modelEfficiency;
  const citations = financialResponse?.evidence?.citations || [];

  const argumentsText = formatArguments(filters);
  const hasArguments = argumentsText.length > 0;

  return (
    <div className="mt-3 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs text-slate-700 shadow-xs">
      {/* Anomaly banner if detected */}
      {anomaly && anomaly.detected && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-start gap-2 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">Anomaly Alert: </span>
            <span>{anomaly.alertMessage}</span>
          </div>
        </div>
      )}

      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 transition-colors font-medium text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-800">FinOps Evidence</span>
          {toolName !== "N/A" && (
            <span className="hidden sm:inline-block font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{toolName}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {confidence && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                confidence.grade === "HIGH"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : confidence.grade === "MEDIUM"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {confidence.score}% {confidence.grade}
            </span>
          )}
          <ValidationBadge status={validationStatus} />
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="p-3 space-y-3 border-t border-slate-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>MCP Tool:</span>
              <span className="font-mono font-semibold text-slate-800 break-all">{toolName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Records Grounded:</span>
              <strong className="text-slate-800">{recordCount}</strong>
            </div>

            {efficiency && (
              <>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Execution Latency:</span>
                  <span className="font-medium text-slate-800">{financialResponse?.evidence?.executionTimeMs ?? efficiency.latencyMs} ms</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Tokens Used:</span>
                  <span className="font-medium text-slate-800">{efficiency.tokensUsed > 0 ? efficiency.tokensUsed : "Cached / Direct"}</span>
                </div>
              </>
            )}
          </div>

          {/* Confidence disclaimer */}
          {confidence && confidence.disclaimer && (
            <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{confidence.disclaimer}</span>
            </div>
          )}

          {/* Arguments */}
          {hasArguments && (
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                Query Arguments
              </div>
              <pre className="font-mono text-blue-700 whitespace-pre-wrap break-words text-[11px] leading-snug">{argumentsText}</pre>
            </div>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Database Citations ({citations.length})</span>
                <span className="text-[9px] font-normal text-slate-400">Verified Ledger Grounding</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto divide-y divide-slate-100">
                {citations.map((c, idx) => {
                  const refText = c.sourceId || c.ref || `Record #${idx + 1}`;
                  return (
                    <div key={idx} className="font-mono text-[10px] text-slate-600 flex items-center justify-between pt-1 first:pt-0">
                      <span className="truncate max-w-[220px]" title={refText}>
                        Ref: <strong className="text-slate-800">{refText}</strong>
                      </span>
                      <span className="shrink-0 text-right">
                        {c.date && <span className="mr-2 text-slate-400">{c.date}</span>}
                        {c.amount && <strong className="text-emerald-700 font-semibold">₹{c.amount}</strong>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SQL Query Toggle */}
          {sqlQuery && (
            <div className="space-y-1">
              <button
                onClick={() => setShowSql(!showSql)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                {showSql ? "Hide Parameterized SQL" : "View Parameterized SQL"}
              </button>
              {showSql && (
                <pre className="p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-700 leading-relaxed whitespace-pre-wrap">
                  {sqlQuery}
                </pre>
              )}
            </div>
          )}

          {/* Langfuse Trace & Inspect JSON Actions */}
          <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
            {financialResponse?.langfuseUrl ? (
              <a
                href={financialResponse.langfuseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-blue-600 flex items-center gap-1"
              >
                <span>Trace:</span>
                <span className="font-mono text-[10px] underline">{financialResponse.traceId}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400">Audit Trail Grounded</span>
            )}

            <button onClick={() => setShowJson(!showJson)} className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[10px]">
              <FileCode className="w-3 h-3" />
              {showJson ? "Hide Raw JSON" : "Inspect JSON"}
            </button>
          </div>

          {showJson && (
            <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-700">
              {JSON.stringify(financialResponse || evidence, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
