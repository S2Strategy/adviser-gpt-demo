import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    strategies?: string[];
    types?: string[];
    tags?: string[];
    statuses?: string[];
  };
  sort?: string;
  createdAt: Date;
}

interface SavedSearchesContextType {
  savedSearches: SavedSearch[];
  saveSearch: (name: string, query: string, filters: SavedSearch['filters'], sort?: string) => void;
  deleteSearch: (id: string) => void;
  loadSearch: (search: SavedSearch) => {
    query: string;
    filters: SavedSearch['filters'];
    sort?: string;
  };
  getRecentSearches: (limit?: number) => SavedSearch[];
}

const SavedSearchesContext = createContext<SavedSearchesContextType | undefined>(undefined);

const SAVED_SEARCHES_KEY = 'vault-saved-searches';

interface SavedSearchesProviderProps {
  children: ReactNode;
}

export function SavedSearchesProvider({ children }: SavedSearchesProviderProps) {
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

  const saveSearch = (name: string, query: string, filters: SavedSearch['filters'], sort?: string) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      sort,
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
      sort: search.sort,
    };
  };

  const getRecentSearches = (limit: number = 5) => {
    return savedSearches.slice(0, limit);
  };

  const value: SavedSearchesContextType = {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch,
    getRecentSearches,
  };

  return (
    <SavedSearchesContext.Provider value={value}>
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches() {
  const context = useContext(SavedSearchesContext);
  if (context === undefined) {
    throw new Error('useSavedSearches must be used within a SavedSearchesProvider');
  }
  return context;
}
