'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Wrench, SlidersHorizontal } from 'lucide-react';
import { EvidenceObject } from '../lib/types';
import { ValidationBadge } from './ValidationBadge';

interface EvidenceCardProps {
  evidence: EvidenceObject;
}

function formatArguments(filters?: Record<string, any>): string {
  if (!filters || Object.keys(filters).length === 0) return '';
  return Object.entries(filters)
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: (empty)`;
      if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${value}`;
    })
    .join('\n');
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(false);

  const argumentsText = formatArguments(evidence.filters);
  const hasArguments = argumentsText.length > 0;

  return (
    <div className="mt-3 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs text-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 transition-colors font-medium"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">FinOps Evidence</span>
        </div>
        <ValidationBadge status={evidence.validationStatus} />
      </button>

      {isOpen && (
        <div className="p-3 space-y-2.5 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Tool:</span>
            <span className="font-mono font-semibold text-slate-800 break-all">{evidence.tool || 'N/A'}</span>
          </div>

          {hasArguments && (
            <div className="p-2 rounded bg-slate-100/70 border border-slate-200/80">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                Arguments
              </div>
              <pre className="font-mono text-blue-700 whitespace-pre-wrap break-words text-[11px] leading-snug">
                {argumentsText}
              </pre>
            </div>
          )}

          <div className="pt-0.5 text-[11px] text-slate-400">
            Records: <strong className="text-slate-700">{evidence.recordCount ?? 1}</strong>
          </div>
        </div>
      )}
    </div>
  );
};