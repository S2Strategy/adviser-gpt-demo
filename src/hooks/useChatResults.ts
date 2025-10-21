import { useState, useEffect, useCallback, useMemo } from 'react';

const CHAT_RESULTS_KEY = 'adviser-gpt-chat-results';
const CHAT_RESULTS_EVENT = 'ag:chat-results-updated';

export interface Source {
  id: string;
  name: string;
  type: string;
  similarity: number;
  snippet: string;
  strategy?: string;
  isUsed: boolean;
  lastModified: Date;
}

export interface ComplianceCheck {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  suggestion?: string;
}

export interface ChatResult {
  id: string;
  query: string;
  answer: string;
  sources: Source[];
  vaultRatio: number;
  aiRatio: number;
  lastSynced: Date;
  version: number;
  complianceChecks?: ComplianceCheck[];
  mode: 'answer' | 'chat' | 'riaOutreach';
  timestamp: number;
  displayTitle: string;
}

/** Safely read from localStorage (SSR/first paint safe). */
const read = (): ChatResult[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHAT_RESULTS_KEY);
    return raw ? (JSON.parse(raw) as ChatResult[]) : [];
  } catch {
    return [];
  }
};

/** Safely write to localStorage and notify other hook instances in this tab. */
const write = (next: ChatResult[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAT_RESULTS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota or serialization errors
  }
  // notify other hook instances in the same tab (async to prevent render issues)
  setTimeout(() => {
    try {
      window.dispatchEvent(new Event(CHAT_RESULTS_EVENT));
    } catch {
      // older browsers may not support Event constructor; fall back if needed
      const ev = document.createEvent?.('Event');
      if (ev) {
        ev.initEvent(CHAT_RESULTS_EVENT, false, false);
        window.dispatchEvent(ev);
      }
    }
  }, 0);
};

/** Create a stable ID (works without crypto.randomUUID in older envs). */
const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/** Truncate query to a few words for display in sidebar */
const truncateQuery = (query: string, maxWords: number = 4): string => {
  const words = query.trim().split(/\s+/);
  if (words.length <= maxWords) return query;
  return words.slice(0, maxWords).join(' ') + '...';
};

export function useChatResults() {
  // Local state mirrors localStorage and stays live via events
  const [chatResults, setChatResults] = useState<ChatResult[]>(() => read());

  // Keep all hook instances in sync:
  // 1) cross-tab via native 'storage' event
  // 2) same-tab via our custom CHAT_RESULTS_EVENT
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAT_RESULTS_KEY) setChatResults(read());
    };
    const onLocalEvent = () => setChatResults(read());

    window.addEventListener('storage', onStorage);
    window.addEventListener(CHAT_RESULTS_EVENT, onLocalEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHAT_RESULTS_EVENT, onLocalEvent);
    };
  }, []);

  /**
   * Save a complete chat result with answer and sources.
   */
  const saveChatResult = useCallback(
    (result: Omit<ChatResult, 'id' | 'timestamp' | 'displayTitle'>) => {
      setChatResults(prev => {
        const newResult: ChatResult = {
          ...result,
          id: makeId(),
          timestamp: Date.now(),
          displayTitle: truncateQuery(result.query),
        };

        // Remove any existing identical results to avoid duplicates
        const filtered = prev.filter(item => 
          item.query.toLowerCase() !== newResult.query.toLowerCase() ||
          item.mode !== newResult.mode
        );
        
        // Add new result to the beginning and limit to 50 results
        const next = [newResult, ...filtered].slice(0, 50);
        write(next);
        return next;
      });
    },
    []
  );

  /**
   * Get a chat result by ID.
   */
  const getChatResult = useCallback((id: string): ChatResult | null => {
    return chatResults.find(result => result.id === id) || null;
  }, [chatResults]);

  /**
   * Get a chat result by query and mode.
   */
  const getChatResultByQuery = useCallback((query: string, mode: 'answer' | 'chat' | 'riaOutreach'): ChatResult | null => {
    return chatResults.find(result => 
      result.query.toLowerCase() === query.toLowerCase() && result.mode === mode
    ) || null;
  }, [chatResults]);

  /**
   * Remove a chat result by ID.
   */
  const removeChatResult = useCallback((id: string) => {
    setChatResults(prev => {
      const next = prev.filter(item => item.id !== id);
      write(next);
      return next;
    });
  }, []);

  /**
   * Clear all chat results.
   */
  const clearChatResults = useCallback(() => {
    setChatResults([]);
    write([]);
  }, []);

  // Get recent chat results for sidebar display (limited to 10)
  const recentChatResults = useMemo(() => 
    chatResults.slice(0, 10), 
    [chatResults]
  );

  return {
    chatResults,              // full list
    recentChatResults,        // top 10 for sidebar
    saveChatResult,
    getChatResult,
    getChatResultByQuery,
    removeChatResult,
    clearChatResults,
  };
}
