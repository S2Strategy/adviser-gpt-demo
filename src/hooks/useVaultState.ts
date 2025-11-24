import { useState, useEffect, useCallback } from 'react';
import { VaultState, VaultFilters } from '@/types/vault';

// LocalStorage keys
const STORAGE_KEYS = {
  query: 'ag_vault_query',
  filters: 'ag_vault_filters', 
  activeView: 'ag_vault_activeView',
  edits: 'ag_vault_edits',
  sort: 'ag_vault_sort',
  showArchived: 'ag_vault_showArchived'
};

export function useVaultState() {
  const [state, setState] = useState<VaultState>({
    query: '',
    filters: {},
    activeView: 'files',
    sort: 'name',
    showArchived: false
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedQuery = localStorage.getItem(STORAGE_KEYS.query) || '';
      const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
      const savedView = localStorage.getItem(STORAGE_KEYS.activeView) as VaultState['activeView'] || 'files';
      const savedSort = localStorage.getItem(STORAGE_KEYS.sort) || 'name';
      const savedShowArchived = localStorage.getItem(STORAGE_KEYS.showArchived) === 'true';

      setState({
        query: savedQuery,
        filters: savedFilters ? JSON.parse(savedFilters) : {},
        activeView: savedView,
        sort: savedSort,
        showArchived: savedShowArchived
      });
    } catch (error) {
      console.warn('Failed to load vault state from localStorage:', error);
    }
  }, []);

  // Update query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    localStorage.setItem(STORAGE_KEYS.query, query);
  }, []);

  // Update filters
  const setFilters = useCallback((filters: VaultFilters) => {
    setState(prev => ({ ...prev, filters }));
    localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
  }, []);

  // Update active view
  const setActiveView = useCallback((activeView: VaultState['activeView']) => {
    setState(prev => ({ ...prev, activeView }));
    localStorage.setItem(STORAGE_KEYS.activeView, activeView);
  }, []);

  // Update sort
  const setSort = useCallback((sort: string) => {
    setState(prev => ({ ...prev, sort }));
    localStorage.setItem(STORAGE_KEYS.sort, sort);
  }, []);

  // Update show archived
  const setShowArchived = useCallback((showArchived: boolean) => {
    setState(prev => ({ ...prev, showArchived }));
    localStorage.setItem(STORAGE_KEYS.showArchived, showArchived.toString());
  }, []);

  // Clear all state
  const clearState = () => {
    const clearedState: VaultState = {
      query: '',
      filters: {},
      activeView: 'files',
      sort: 'name',
      showArchived: false
    };
    setState(clearedState);
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.edits) { // Preserve edits
        localStorage.removeItem(key);
      }
    });
  };

  return {
    state,
    setQuery,
    setFilters,
    setActiveView, 
    setSort,
    setShowArchived,
    clearState
  };
}

// Hook for managing edits
export function useVaultEdits() {
  const [edits, setEdits] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const savedEdits = localStorage.getItem(STORAGE_KEYS.edits);
      if (savedEdits) {
        setEdits(JSON.parse(savedEdits));
      }
    } catch (error) {
      console.warn('Failed to load vault edits:', error);
    }
  }, []);

  // Persist edits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(edits));
    } catch (error) {
      console.warn('Failed to save vault edits:', error);
    }
  }, [edits]);

  // const saveEdit = (itemId: string, editData: any) => {
  //   const currentEdit = edits[itemId] || {};
  //   const newEdit = { ...currentEdit, ...editData };
  //   const newEdits = { ...edits, [itemId]: newEdit };
  //   setEdits(newEdits);
  //   localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(newEdits));
  // };

  // already existing single-item saver — keep but make it functional
  const saveEdit = (id: string, data: any) => {
    setEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...data },
    }));
  };

  // NEW: commit many edits in one state update
  const saveManyEdits = (entries: Array<[string, any]>) => {
    setEdits(prev => {
      const next = { ...prev };
      for (const [id, data] of entries) {
        next[id] = { ...(next[id] ?? {}), ...data };
      }
      return next;
    });
  };

  const getEdit = (itemId: string) => {
    return edits[itemId];
  };

  const clearEdit = (itemId: string) => {
    const newEdits = { ...edits };
    delete newEdits[itemId];
    setEdits(newEdits);
    localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(newEdits));
  };

  return { edits, saveEdit, getEdit, clearEdit, saveManyEdits };
}