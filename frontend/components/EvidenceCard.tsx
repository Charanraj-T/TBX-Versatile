'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Database, Wrench, FileCode, CheckCircle2 } from 'lucide-react';
import { EvidenceObject } from '@/lib/types';
import { ValidationBadge } from './ValidationBadge';

interface EvidenceCardProps {
  evidence: EvidenceObject;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden text-xs text-slate-700 dark:text-slate-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-medium select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>FinOps Evidence & Audit Trail</span>
          {evidence.tool && (
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">
              {evidence.tool}
            </span>
          )}
        </div>
        <ValidationBadge status={evidence.validationStatus} />
      </button>

      {isOpen && (
        <div className="p-3 space-y-2.5 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Source:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{evidence.source || 'PostgreSQL'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>MCP Tool:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{evidence.tool || 'N/A'}</span>
            </div>
          </div>

          {evidence.calculation && (
            <div className="p-2 rounded bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Database Calculation Formula
              </div>
              <code className="text-teal-700 dark:text-teal-300 font-mono break-all text-[11px]">
                {evidence.calculation}
              </code>
            </div>
          )}

          {evidence.validationNotes && evidence.validationNotes.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Audit Validation Checks
              </div>
              <ul className="space-y-1">
                {evidence.validationNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Records: <strong className="text-slate-700 dark:text-slate-300">{evidence.recordCount ?? 1}</strong>
            </span>
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono"
            >
              <FileCode className="w-3 h-3" />
              {showJson ? 'Hide Raw JSON' : 'Inspect JSON'}
            </button>
          </div>

          {showJson && (
            <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-700">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

