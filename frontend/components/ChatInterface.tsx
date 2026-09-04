'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/lib/types';
import { sendChatMessage } from '@/lib/api';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Trash2, Sparkles, AlertCircle, Info } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  "What is Vendor A's total spend?",
  "How much did Vendor B receive?",
  "Compare Vendor A's spend between January and February.",
  "Give me an overall transaction summary across all vendors."
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "👋 Hello! I am the **TBX FinOps Assistant**.\n\nI can query your vendor financial transactions, audit spend totals via Google MCP Toolbox, and present verified financial evidence directly from PostgreSQL.",
      timestamp: new Date(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    setErrorBanner(null);
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendChatMessage(messageText);
      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: response.answer,
        evidence: response.evidence,
        provider: response.provider,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to FinOps Backend API.'}`,
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setErrorBanner(err.message || 'Communication error with backend');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setErrorBanner(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-teal-600" />
          <span>Demo Data Mode Active (PostgreSQL + MCP Toolbox)</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Error banner */}
      {errorBanner && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 px-4 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <MessageList messages={messages} loading={loading} />
      </div>

      {/* Suggested chips & input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-500" />
            Try:
          </span>
          {EXAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/40 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <MessageInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
};

