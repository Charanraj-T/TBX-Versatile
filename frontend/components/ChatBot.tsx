'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles, RotateCcw, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../lib/types';
import { sendChatMessage } from '../lib/api';
import { EvidenceCard } from './EvidenceCard';

interface ChatBotProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const SESSION_KEY = 'tbx_finops_session_id';

const SUGGESTIONS: { label: string; query: string }[] = [
  { label: 'Check account balance', query: 'What is the available balance of account XXXXXX9069?' },
  { label: 'Recent transactions', query: 'Show the recent transaction history for account 9069' },
  { label: 'Monthly debits & credits', query: 'How many debit and credit transactions happened in May 2026?' },
  { label: 'Registered banks', query: 'List all the registered banks' },
];

function getSessionId(): string {
  let id = '';
  try {
    id = localStorage.getItem(SESSION_KEY) || '';
  } catch {
  }
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {
    }
  }
  return id;
}

function rotateSessionId(): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
  }
  return id;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hello! I am the **Versatile FinOps** assistant.\n\nI query your vendor financial transactions and reconciliation ledger, audit spend totals via PostgreSQL, and present verified financial evidence.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const hasUserMessage = messages.some((m) => m.role === 'user');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSendMessage = async (preset?: string) => {
    const text = (preset || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!preset) setInputText('');
    setLoading(true);

    try {
      const data = await sendChatMessage(text, getSessionId());
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          evidence: data.evidence,
          provider: data.provider,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err.message || 'Unable to connect to FinOps Backend API.'}`,
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
    rotateSessionId();
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
          const isUser = msg.role === 'user';
          return (
            <React.Fragment key={msg.id}>
              <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[80%] space-y-1">
                <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.isError && (
                    <div className="flex items-center gap-1.5 font-semibold text-rose-600 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Error</span>
                    </div>
                  )}

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
                        td: ({ children }) => (
                          <td className="px-3 py-2 text-slate-700 border-b border-slate-100">{children}</td>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {!isUser && msg.evidence && <EvidenceCard evidence={msg.evidence} />}
                </div>

                <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.provider && !isUser && (
                    <span className="ml-1.5 font-mono text-[9px] uppercase px-1 rounded bg-slate-200 text-slate-600">
                      {msg.provider}
                    </span>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>

              {msg.id === 'welcome-msg' && !hasUserMessage && !loading && (
                <div className="flex flex-wrap gap-2 mt-1 ml-11">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.query}
                      onClick={() => handleSendMessage(s.query)}
                      className="text-left flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/60 shadow-2xs transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                      {s.label}
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
              <span>Querying PostgreSQL ledger...</span>
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