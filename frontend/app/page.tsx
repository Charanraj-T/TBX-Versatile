'use client';

import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { HealthBadge } from '@/components/HealthBadge';
import { Coins } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-md">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              TBX FinOps Assistant
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                Starter
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic Auditing • Google MCP Toolbox • Spring AI
            </p>
          </div>
        </div>

        <HealthBadge />
      </header>

      {/* Main Chat Interface */}
      <section className="flex-1 max-w-4xl w-full mx-auto">
        <ChatInterface />
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
        TBX FinOps Monorepo Architecture • Next.js → Spring Boot → Google MCP Toolbox → PostgreSQL
      </footer>
    </main>
  );
}

