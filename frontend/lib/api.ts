import { FinancialResponse, HealthResponse } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getConversationId(): string {
  if (typeof window === 'undefined') return 'server-side';
  let id = localStorage.getItem('tbx-conversation-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('tbx-conversation-id', id);
  }
  return id;
}

export function resetConversation(): string {
  const id = crypto.randomUUID();
  localStorage.setItem('tbx-conversation-id', id);
  return id;
}

export async function sendChatMessage(message: string): Promise<FinancialResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId: getConversationId() }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend responded with HTTP ${response.status}`);
  }
  return response.json();
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Speech-to-text failed with HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.transcript || '';
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json();
}

export async function fetchTransactions(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/data/transactions`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load transactions: HTTP ${response.status}`);
  }

  return response.json();
}
