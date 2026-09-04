'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { EvidenceCard } from './EvidenceCard';
import { Bot, User, AlertCircle, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="space-y-4 py-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-1`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-tl-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {msg.isError && (
                  <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Error</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {!isUser && msg.evidence && (
                  <EvidenceCard evidence={msg.evidence} />
                )}
              </div>

              <div
                className={`text-[10px] text-slate-400 px-1 ${
                  isUser ? 'text-right' : 'text-left'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {msg.provider && !isUser && (
                  <span className="ml-1.5 font-mono text-[9px] uppercase px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
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
        );
      })}

      {loading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500 flex items-center gap-2 shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Querying Google MCP Toolbox & PostgreSQL...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

