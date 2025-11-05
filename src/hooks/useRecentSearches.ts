import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRange } from '@/components/FiltersPanel';

const RECENT_SEARCHES_KEY = 'adviser-gpt-recent-searches';
const LAST_MODE_KEY = 'adviser-gpt-last-mode';
const RECENT_SEARCHES_EVENT = 'ag:recent-searches-updated';
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearchItem {
  id: string;
  query: string;
  displayTitle: string;
  timestamp: number;
  mode: 'answer' | 'chat' | 'riaOutreach';
  filters?: {
    tags: string[];
    strategies: string[];
    documents: string[];
    dateRange?: DateRange | null;
    priorSamples: Array<{
      id: string;
      name: string;
      type: string;
    }>;
  };
  uploadedFiles?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
  }>;
}

/** Safely read from localStorage (SSR/first paint safe). */
const read = (): RecentSearchItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as RecentSearchItem[]) : [];
  } catch {
    return [];
  }
};

/** Safely write to localStorage and notify other hook instances in this tab. */
const write = (next: RecentSearchItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore quota or serialization errors
  }
  // notify other hook instances in the same tab
  try {
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  } catch {
    // older browsers may not support Event constructor; fall back if needed
    const ev = document.createEvent?.('Event');
    if (ev) {
      ev.initEvent(RECENT_SEARCHES_EVENT, false, false);
      window.dispatchEvent(ev);
    }
  }
};

/** Safely read last mode from localStorage. */
const readLastMode = (): 'answer' | 'chat' | 'riaOutreach' => {
  if (typeof window === 'undefined') return 'answer';
  try {
    const mode = window.localStorage.getItem(LAST_MODE_KEY);
    return (mode === 'answer' || mode === 'chat' || mode === 'riaOutreach') ? mode : 'answer';
  } catch {
    return 'answer';
  }
};

/** Safely write last mode to localStorage. */
const writeLastMode = (mode: 'answer' | 'chat' | 'riaOutreach') => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_MODE_KEY, mode);
  } catch {
    // ignore quota or serialization errors
  }
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

export function useRecentSearches() {
  // Local state mirrors localStorage and stays live via events
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => read());

  // Keep all hook instances in sync:
  // 1) cross-tab via native 'storage' event
  // 2) same-tab via our custom RECENT_SEARCHES_EVENT
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_SEARCHES_KEY) setRecentSearches(read());
    };
    const onLocalEvent = () => setRecentSearches(read());

    window.addEventListener('storage', onStorage);
    window.addEventListener(RECENT_SEARCHES_EVENT, onLocalEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(RECENT_SEARCHES_EVENT, onLocalEvent);
    };
  }, []);

  /**
   * Add a new search to recent searches.
   */
  const addRecentSearch = useCallback(
    (
      query: string, 
      mode: 'answer' | 'chat' | 'riaOutreach' = 'answer',
      filters?: {
        tags: string[];
        strategies: string[];
        documents: string[];
        dateRange?: DateRange | null;
        priorSamples: Array<{
          id: string;
          name: string;
          type: string;
        }>;
      },
      uploadedFiles?: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
      }>
    ) => {
      if (!query.trim()) return;

      setRecentSearches(prev => {
        const newItem: RecentSearchItem = {
          id: makeId(),
          query: query.trim(),
          displayTitle: truncateQuery(query.trim()),
          timestamp: Date.now(),
          mode,
          filters,
          uploadedFiles,
        };

        // Remove any existing identical searches to avoid duplicates
        const filtered = prev.filter(item => item.query.toLowerCase() !== newItem.query.toLowerCase());
        
        // Add new item to the beginning and limit to MAX_RECENT_SEARCHES
        const next = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        write(next);
        return next;
      });
    },
    []
  );

  const removeRecentSearch = useCallback((id: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(item => item.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    write([]);
  }, []);

  // Get recent searches for sidebar display (limited to 5)
  const recentSearchesForSidebar = useMemo(() => 
    recentSearches.slice(0, 5), 
    [recentSearches]
  );

  return {
    recentSearches,              // full list
    recentSearchesForSidebar,    // top 5 for sidebar
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getLastMode: readLastMode,   // get last selected mode
    setLastMode: writeLastMode,  // save last selected mode
  };
}
