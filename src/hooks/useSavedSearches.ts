import { useState, useEffect } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    strategy?: string;
    contentType?: string;
    tags?: string[];
  };
  createdAt: Date;
}

const SAVED_SEARCHES_KEY = 'vault-saved-searches';

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedSearches(parsed.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt)
        })));
      } catch {
        setSavedSearches([]);
      }
    }
  }, []);

  const saveSearch = (name: string, query: string, filters: SavedSearch['filters']) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      createdAt: new Date(),
    };

    const newSavedSearches = [newSearch, ...savedSearches];
    setSavedSearches(newSavedSearches);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSavedSearches));
  };

  const deleteSearch = (id: string) => {
    const newSavedSearches = savedSearches.filter(search => search.id !== id);
    setSavedSearches(newSavedSearches);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSavedSearches));
  };

  const loadSearch = (search: SavedSearch) => {
    return {
      query: search.query,
      filters: search.filters,
    };
  };

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch,
  };
}