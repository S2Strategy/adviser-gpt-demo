import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { QuestionCard } from "./QuestionCard";
import { VaultEditSheet } from "./VaultEditSheet";
import { FirmUpdatesModal } from "./FirmUpdatesModal";
import { FindDuplicatesModal } from "./FindDuplicatesModal";
import { SmartUploadSheet } from "./SmartUploadSheet";
import { SaveSearchPrompt } from "./SaveSearchPrompt";
import { ChangeHistoryModal } from "./ChangeHistoryModal";
import { SortAndArchiveControls, SortColumn, SortDirection } from "./SortAndArchiveControls";
import { 
  Search, 
  ChevronDown,
  ChevronRight,
  MoreHorizontal, 
  FileText, 
  ArrowUpDown,
  ArrowLeft,
  Copy,
  Building2,
  Upload,
  MessagesSquare,
  Shapes,
  Lightbulb,
  Database,
  Clock,
  FolderOpen,
  X,
  Check,
  Archive,
  Filter,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, TAGS_INFO, QuestionItem } from "@/types/vault";
import { FiltersPanel, DateRange } from "./FiltersPanel";
import { migrateQuestionItem, migrateQuestionItems } from "@/utils/tagMigration";
import { smartSearch, getSemanticVariations, getSearchSuggestions } from "@/utils/smartSearch";
import { format, subDays, subMonths } from "date-fns";

export function VaultHomepage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, setQuery, setFilters, setActiveView, setSort, setShowArchived } = useVaultState();
  const { edits, saveEdit, getEdit, saveManyEdits } = useVaultEdits();
  const { addToHistory } = useSearchHistory();
  const { toast } = useToast();
  
  // Extract URL parameters
  const urlQuery = searchParams.get('query') || '';
  const fileName = searchParams.get('fileName');
  const fileCount = parseInt(searchParams.get('count') || '0');
  const isFileMode = fileName && !urlQuery;

  // Search and filter state
  const [searchInput, setSearchInput] = useState(urlQuery || state.query);
  
  // Sync state.query with URL query parameter (only when URL changes, not when state changes)
  useEffect(() => {
    if (urlQuery !== state.query) {
      setQuery(urlQuery);
    }
    // Only depend on urlQuery, not state.query, to avoid circular updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, setQuery]);

  // Sync filter states with URL parameters (only when URL changes)
  useEffect(() => {
    const urlStrategy = searchParams.get('strategy')?.split(',').filter(Boolean) || [];
    const urlType = searchParams.get('type')?.split(',').filter(Boolean) || [];
    const urlTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const urlStatus = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const urlShowArchived = searchParams.get('showArchived') === 'true';
    
    // Convert legacy URL params to new tag filter format
    const tagFilters: Record<string, string[]> = {};
    if (urlStrategy.length > 0) {
      tagFilters['Strategy'] = urlStrategy;
    }
    if (urlType.length > 0) {
      tagFilters['Type'] = urlType;
    }
    if (urlTags.length > 0) {
      tagFilters['Category'] = urlTags;
    }
    if (urlStatus.length > 0) {
      tagFilters['Status'] = urlStatus;
    }
    setSelectedTagFilters(tagFilters);
    
    // Keep legacy state for backward compatibility during transition
    setSelectedStrategy(urlStrategy);
    setSelectedType(urlType);
    setSelectedTags(urlTags);
    setSelectedStatus(urlStatus);
    setSearchInput(urlQuery);
    
    // Sync showArchived with URL parameter (only if different to avoid loops)
    if (urlShowArchived !== state.showArchived) {
      setShowArchived(urlShowArchived);
    }
    // Only depend on searchParams and urlQuery, not state, to avoid circular updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, urlQuery, setShowArchived]);
  // New tag filter structure
  const [selectedTagFilters, setSelectedTagFilters] = useState<Record<string, string[]>>({});
  // Legacy state for backward compatibility (will be removed)
  const [selectedStrategy, setSelectedStrategy] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
  // FiltersPanel state
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedPriorSamples, setSelectedPriorSamples] = useState<string[]>([]);
  const [fileHistory] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>>([]); // Empty array as VaultHomepage doesn't use file uploads
  
  // Sorting and view state
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Recent QA sort state
  const [qaSortColumn, setQaSortColumn] = useState<SortColumn>("lastModified");
  const [qaSortDirection, setQaSortDirection] = useState<SortDirection>("desc");
  const currentSort = searchParams.get('sort') || state.sort || 'relevance';
  
  // UI state
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [nestedExpanded, setNestedExpanded] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<QuestionItem | null>(null);
  const [editingOriginalItem, setEditingOriginalItem] = useState<QuestionItem | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "documents">("recent");
  const [showFirmUpdatesModal, setShowFirmUpdatesModal] = useState(false);
  const [showFindDuplicatesModal, setShowFindDuplicatesModal] = useState(false);
  const [showSmartUploadSheet, setShowSmartUploadSheet] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QuestionItem | null>(null);
  const [historyModalItemId, setHistoryModalItemId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalQuestion, setHistoryModalQuestion] = useState<string>('');
  const [historyModalAnswer, setHistoryModalAnswer] = useState<string>('');

  // Load saved tab state from localStorage (only on mount)
  useEffect(() => {
    const savedTab = localStorage.getItem('vault-homepage-active-tab');
    if (savedTab && (savedTab === "recent" || savedTab === "documents")) {
      setActiveTab(savedTab);
    }
    
    // Load saved documents sub-tab state
    const savedDocumentsTab = localStorage.getItem('vault-homepage-documents-tab');
    if (savedDocumentsTab && ["files", "type", "strategy", "data"].includes(savedDocumentsTab)) {
      setActiveView(savedDocumentsTab as "files" | "type" | "strategy" | "data");
    }
  }, [setActiveView]);

  // Initialize state from URL parameters
  useEffect(() => {
    setSearchInput(urlQuery);
    // Legacy URL params are handled in the other useEffect
  }, [urlQuery]);

  // Save tab state to localStorage when it changes
  const handleTabChange = (tab: "recent" | "documents") => {
    setActiveTab(tab);
    localStorage.setItem('vault-homepage-active-tab', tab);
  };

  // Save documents sub-tab state to localStorage when it changes
  const handleDocumentsTabChange = (tab: "files" | "type" | "strategy" | "data") => {
    setActiveView(tab);
    localStorage.setItem('vault-homepage-documents-tab', tab);
  };

  // Handle sort change from files dropdown
  const handleFilesSortChange = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle sort change from QA dropdown
  const handleQaSortChange = (column: SortColumn) => {
    if (qaSortColumn === column) {
      // Toggle direction if same column
      const newDirection = qaSortDirection === "asc" ? "desc" : "asc";
      setQaSortDirection(newDirection);
    } else {
      // Set new column with ascending direction
      setQaSortColumn(column);
      setQaSortDirection("asc");
    }
  };

  // Flatten the nested data structure for processing and migrate to new tag format
  const flattenItems = (): QuestionItem[] => {
    let items: QuestionItem[] = [];
    
    if (isFileMode && fileName) {
      // In file mode, only show items from the specific file
      const targetDoc = MOCK_CONTENT_ITEMS.find(doc => doc.title === fileName);
      if (targetDoc) {
        items = targetDoc.items.map(item => ({
          ...item,
          documentTitle: targetDoc.title,
          documentId: targetDoc.id
        }));
      }
    } else {
      // In search mode, show all items
      items = MOCK_CONTENT_ITEMS.flatMap(doc => 
        doc.items.map(item => ({
          ...item,
          documentTitle: doc.title,
          documentId: doc.id
        }))
      );
    }
    
    // Migrate items to new tag format
    return migrateQuestionItems(items);
  };

  const allItems = flattenItems();

  // Helper function to normalize strategies (convert single string to array)
  const normalizeStrategies = (strategy: string | string[]): string[] => {
    return Array.isArray(strategy) ? strategy : [strategy];
  };

  // Helper function to merge original item with saved edits
  const getDisplayData = (item: QuestionItem) => {
    const savedEdit = getEdit(item.id);
    if (!savedEdit) {
      // Ensure item is migrated
      return migrateQuestionItem(item);
    }

    // Check if savedEdit tags are in new format
    let tags = savedEdit.tags || item.tags;
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const firstTag = tags[0];
      // If tags are in old format (strings), migrate them
      if (typeof firstTag === 'string') {
        const migrated = migrateQuestionItem({ ...item, tags: tags as string[] });
        tags = migrated.tags;
      }
    } else {
      // No tags in savedEdit, use migrated item tags
      const migrated = migrateQuestionItem(item);
      tags = migrated.tags;
    }

    const result = {
      ...item,
      question: savedEdit.question || item.question,
      answer: savedEdit.answer || item.answer,
      strategy: savedEdit.strategy || item.strategy, // Keep for backward compatibility
      tags, // Use migrated tags
      archived: savedEdit.archived !== undefined ? savedEdit.archived : (item.archived || false),
    };

    return result;
  };

  // Helper function to check if all items in a file are archived
  const isFileArchived = (fileName: string) => {
    const fileItems = allItems.filter(item => item.documentTitle === fileName);
    if (fileItems.length === 0) return false;
    
    return fileItems.every(item => {
      const displayData = getDisplayData(item);
      return displayData.archived;
    });
  };

  // Simple function to archive/restore all items in a file
  const toggleFileArchive = (fileName: string) => {
    const fileItems = allItems.filter(item => item.documentTitle === fileName);
    const isCurrentlyArchived = isFileArchived(fileName);
    
    // Create a batch of edits
    saveManyEdits(
      fileItems.map(item => [item.id, { archived: !isCurrentlyArchived } ])
    );
    
    // Show toast
    toast({
      title: isCurrentlyArchived ? "File restored" : "File archived",
      description: `${fileItems.length} items in "${fileName}" have been ${isCurrentlyArchived ? 'restored' : 'archived'}.`,
      duration: 3000,
    });
  };

  // Helper function to check if all items of a type are archived
  const isTypeArchived = (typeName: string) => {
    const typeItems = allItems.filter(item => item.type === typeName);
    if (typeItems.length === 0) return false;
    
    return typeItems.every(item => {
      const displayData = getDisplayData(item);
      return displayData.archived;
    });
  };

  // Simple function to archive/restore all items of a type
  const toggleTypeArchive = (typeName: string) => {
    const typeItems = allItems.filter(item => item.type === typeName);
    const isCurrentlyArchived = isTypeArchived(typeName);
    
    // // Apply all edits at once
    saveManyEdits(typeItems.map(item => [item.id, { archived: !isCurrentlyArchived }]));
    
    // Show toast
    toast({
      title: isCurrentlyArchived ? "Type restored" : "Type archived",
      description: `${typeItems.length} items of type "${typeName}" have been ${isCurrentlyArchived ? 'restored' : 'archived'}.`,
      duration: 3000,
    });
  };

  // Helper function to check if all items of a strategy are archived
  const isStrategyArchived = (strategyName: string) => {
    const strategyItems = allItems.filter(item => {
      const itemStrategy = Array.isArray(item.strategy) ? item.strategy : [item.strategy];
      return itemStrategy.includes(strategyName);
    });
    if (strategyItems.length === 0) return false;
    
    return strategyItems.every(item => {
      const displayData = getDisplayData(item);
      return displayData.archived;
    });
  };

  // Simple function to archive/restore all items of a strategy
  const toggleStrategyArchive = (strategyName: string) => {
    const strategyItems = allItems.filter(item => {
      const itemStrategy = Array.isArray(item.strategy) ? item.strategy : [item.strategy];
      return itemStrategy.includes(strategyName);
    });
    const isCurrentlyArchived = isStrategyArchived(strategyName);
    
    // Apply all edits at once
    saveManyEdits(strategyItems.map(item => [item.id, { archived: !isCurrentlyArchived }]));
    
    // Show toast
    toast({
      title: isCurrentlyArchived ? "Strategy restored" : "Strategy archived",
      description: `${strategyItems.length} items of strategy "${strategyName}" have been ${isCurrentlyArchived ? 'restored' : 'archived'}.`,
      duration: 3000,
    });
  };

  // Utility function to get date range bounds from DateRange object
  const getDateRangeBounds = (dateRange: DateRange | null): { from: Date; to: Date } | null => {
    if (!dateRange || dateRange.type === 'any') {
      return null;
    }
    
    if (dateRange.type === 'custom') {
      if (dateRange.from && dateRange.to) {
        return { from: dateRange.from, to: dateRange.to };
      }
      return null;
    }
    
    // Calculate preset date ranges (same logic as FiltersPanel)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    switch (dateRange.type) {
      case '7d': {
        const from = subDays(today, 7);
        from.setHours(0, 0, 0, 0);
        return { from, to: today };
      }
      case '30d': {
        const from = subDays(today, 30);
        from.setHours(0, 0, 0, 0);
        return { from, to: today };
      }
      case '3mo': {
        const from = subMonths(today, 3);
        from.setHours(0, 0, 0, 0);
        return { from, to: today };
      }
      case '6mo': {
        const from = subMonths(today, 6);
        from.setHours(0, 0, 0, 0);
        return { from, to: today };
      }
      case '1y': {
        const from = subDays(today, 365);
        from.setHours(0, 0, 0, 0);
        return { from, to: today };
      }
      default:
        return null;
    }
  };

  // Only perform search when explicitly triggered (not on every keystroke)
  const smartSearchResults = state.query ? smartSearch(allItems, state.query) : allItems;
  
  // Apply additional filters to smart search results
  const filteredItems = smartSearchResults.filter(item => {
    const displayData = getDisplayData(item);
    
    // Filter out deleted items
    const edit = getEdit(item.id);
    if (edit?.deleted) {
      return false;
    }
    
    // Filter out archived items unless showArchived is true
    if (!state.showArchived && displayData.archived) {
      return false;
    }
    
    // Tag filtering: OR within each type, AND across types
    // For each tag type filter, check if item has at least one matching tag value
    let matchesAllTagFilters = true;
    for (const [tagTypeName, selectedValues] of Object.entries(selectedTagFilters)) {
      if (selectedValues.length === 0) {
        continue; // No filter for this type
      }
      
      // Get item's tags of this type
      const itemTagsOfType = (displayData.tags || []).filter(
        (tag: { type: string; value: string }) => tag.type === tagTypeName
      );
      
      // Check if any selected value matches any item tag (OR logic within type)
      const matchesThisType = selectedValues.some(selectedValue =>
        itemTagsOfType.some((tag: { type: string; value: string }) => tag.value === selectedValue)
      );
      
      if (!matchesThisType) {
        matchesAllTagFilters = false;
        break; // AND logic across types - if one fails, item is excluded
      }
    }
    
    // Document filtering (OR logic)
    const matchesDocument = selectedDocuments.length === 0 ||
      selectedDocuments.includes(displayData.documentTitle || '');
    
    // Date range filtering (inclusive)
    const dateBounds = getDateRangeBounds(selectedDateRange);
    let matchesDateRange = true;
    if (dateBounds) {
      try {
        const itemDate = new Date(displayData.updatedAt);
        if (isNaN(itemDate.getTime())) {
          matchesDateRange = false;
        } else {
          matchesDateRange = itemDate >= dateBounds.from && itemDate <= dateBounds.to;
        }
      } catch {
        matchesDateRange = false;
      }
    }
    
    return matchesAllTagFilters && matchesDocument && matchesDateRange;
  });

  // Sort filtered items
  const sortItems = (items: QuestionItem[], sortBy: string) => {
    switch (sortBy) {
      case 'lastEdited':
        return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'lastEditor':
        return [...items].sort((a, b) => a.updatedBy.localeCompare(b.updatedBy));
      case 'relevance':
      default:
        return items; // Original order
    }
  };

  const sortedAndFilteredItems = sortItems(filteredItems, currentSort);

  const totalFiltersCount = Object.values(selectedTagFilters).reduce((sum, values) => sum + values.length, 0) +
                           selectedDocuments.length + selectedPriorSamples.length +
                           (selectedDateRange && selectedDateRange.type !== 'any' ? 1 : 0);
  
  const hasActiveFilters = Object.values(selectedTagFilters).some(values => values.length > 0) ||
                           selectedDocuments.length > 0 || selectedPriorSamples.length > 0 || 
                           (selectedDateRange && selectedDateRange.type !== 'any');
  const hasActiveSearch = (state.query && state.query.trim()) || hasActiveFilters;
  
  // Check if there are any parent questions with children
  const hasNestedQuestions = allItems.some(item => item.children && item.children.length > 0);

  const handleSearch = () => {
    // Check if there's search text or any filters selected
    const hasSearchText = searchInput.trim();
    const hasFilters = Object.values(selectedTagFilters).some(values => values.length > 0) ||
                       selectedDocuments.length > 0 || selectedPriorSamples.length > 0 || 
                       (selectedDateRange && selectedDateRange.type !== 'any');
    
    if (hasSearchText || hasFilters) {
      // Add to search history
      addToHistory(searchInput, {
        strategies: selectedStrategy,
        types: selectedType,
        tags: selectedTags,
        statuses: selectedStatus
      }, currentSort);
      
      // Update URL parameters - let the useEffect sync state from URL
      const params = new URLSearchParams();
      // Only set query param if there's actual search text
      if (hasSearchText) {
        params.set('query', searchInput);
      }
      if (selectedStrategy.length > 0) params.set('strategy', selectedStrategy.join(','));
      if (selectedType.length > 0) params.set('type', selectedType.join(','));
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (selectedStatus.length > 0) params.set('status', selectedStatus.join(','));
      // Note: documents, dateRange, and priorSamples can be added to URL params later if needed
      
      // Update URL using React Router navigation
      // The useEffect will sync state from URL, avoiding circular updates
      const newUrl = `/vault?${params.toString()}`;
      navigate(newUrl);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSelectedTagFilters({});
    setSelectedDocuments([]);
    setSelectedDateRange(null);
    setSelectedPriorSamples([]);
    
    // Update URL parameters using React Router navigation
    const params = new URLSearchParams();
    if (state.query) {
      params.set('query', state.query);
    }
    const newUrl = `/vault?${params.toString()}`;
    navigate(newUrl);
  };

  const handleArchive = (itemId: string) => {
    const currentEdit = getEdit(itemId) || {};
    const originalItem = allItems.find(item => item.id === itemId);
    const isCurrentlyArchived = currentEdit.archived !== undefined ? currentEdit.archived : originalItem?.archived || false;
    
    saveEdit(itemId, { ...currentEdit, archived: !isCurrentlyArchived });
    
    toast({
      title: isCurrentlyArchived ? "Item unarchived" : "Item archived",
      description: isCurrentlyArchived ? "The item has been restored from archive." : "The item has been archived and will be hidden from search results.",
    });
  };

  const handleDelete = (itemId: string) => {
    const item = allItems.find(item => item.id === itemId);
    if (item) {
      setItemToDelete(item);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const currentEdit = getEdit(itemToDelete.id) || {};
      saveEdit(itemToDelete.id, { ...currentEdit, deleted: true });
      
      toast({
        title: "Item deleted",
        description: "The item has been permanently deleted.",
      });
      
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteAllArchived = () => {
    setDeleteAllConfirmOpen(true);
  };

  const confirmDeleteAllArchived = () => {
    // Get all currently visible archived items
    const archivedItems = sortedAndFilteredItems.filter(item => {
      const displayData = getDisplayData(item);
      return displayData.archived;
    });

    if (archivedItems.length > 0) {
      // Mark all as deleted
      const deleteEdits = archivedItems.map(item => {
        const currentEdit = getEdit(item.id) || {};
        return [item.id, { ...currentEdit, deleted: true }] as [string, Record<string, unknown>];
      });
      
      saveManyEdits(deleteEdits);
      
      toast({
        title: "Items deleted",
        description: `${archivedItems.length} archived item(s) have been permanently deleted.`,
      });
    }
    
    setDeleteAllConfirmOpen(false);
  };

  const handleSortChange = (sortValue: string) => {
    setSort(sortValue);
    
    const params = new URLSearchParams(searchParams);
    if (sortValue !== 'relevance') {
      params.set('sort', sortValue);
    } else {
      params.delete('sort');
    }
    
    // Preserve existing parameters
    if (state.query) params.set('query', state.query);
    if (selectedStrategy.length > 0) params.set('strategy', selectedStrategy.join(','));
    if (selectedType.length > 0) params.set('type', selectedType.join(','));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedStatus.length > 0) params.set('status', selectedStatus.join(','));
    
    // Update URL using React Router navigation
    const newUrl = `/vault?${params.toString()}`;
    navigate(newUrl);
  };

  // Export functionality
  const exportData = async (format: 'pdf' | 'csv' | 'docx') => {
    try {
      toast({
        title: "Preparing export...",
        description: "Please wait while we prepare your data.",
        duration: 2000,
      });

      const { exportToPDF, exportToCSV, exportToDocx, getExportFilename } = await import('@/utils/exportUtils');
      
      const exportItems = filteredItems.map(item => ({
        id: item.id,
        title: item.documentTitle || 'Unknown Document',
        answer: item.answer || '',
        question: item.question || '',
        fileName: item.documentTitle || 'Unknown Document',
        lastEdited: formatFullDate(item.updatedAt),
        lastEditor: item.updatedBy,
        tags: getDisplayData(item).tags,
        strategy: getDisplayData(item).strategy,
        type: item.type
      }));

      const isFileView = fileName && !searchInput;
      const contextTitle = isFileView 
        ? `${filteredItems.length} Questions in ${fileName}`
        : `Search Results for "${searchInput}"`;
      
      const contextName = isFileView ? fileName || 'file' : `Search_${searchInput}`;
      const filename = getExportFilename(format, contextName);

      switch (format) {
        case 'pdf':
          await exportToPDF(exportItems, contextTitle, filename);
          break;
        case 'csv':
          exportToCSV(exportItems, filename);
          break;
        case 'docx':
          await exportToDocx(exportItems, contextTitle, filename);
          break;
      }

      toast({
        title: "Export successful!",
        description: `Your ${format.toUpperCase()} file has been downloaded.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Group items by file for Files view
  const fileGroups = MOCK_CONTENT_ITEMS.map(doc => {
    // Filter out deleted and archived items unless showArchived is true
    const visibleItems = doc.items.filter(item => {
      const edit = getEdit(item.id);
      if (edit?.deleted) {
        return false;
      }
      const displayData = getDisplayData(item);
      return state.showArchived || !displayData.archived;
    });
    
    return {
      name: doc.title,
      totalItems: visibleItems.length,
      type: visibleItems[0]?.type || "Questionnaire",
      strategy: visibleItems[0]?.strategy || "Firm-Wide (Not Strategy-Specific)",
      tags: visibleItems.flatMap(item => item.tags),
      updatedAt: visibleItems[0]?.updatedAt || new Date().toISOString(),
      updatedBy: visibleItems[0]?.updatedBy || "Unknown",
      documentId: doc.id
    };
  }).filter(file => file.totalItems > 0); // Only show files with visible items

  const sortedFiles = fileGroups.sort((a, b) => {
    if (sortColumn === "name") {
      return sortDirection === "asc" ? 
        a.name.localeCompare(b.name) : 
        b.name.localeCompare(a.name);
    } else if (sortColumn === "totalItems") {
      return sortDirection === "asc" ? 
        a.totalItems - b.totalItems : 
        b.totalItems - a.totalItems;
    } else if (sortColumn === "lastEdited") {
      return sortDirection === "asc" ? 
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() :
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortColumn === "lastEditor") {
      return sortDirection === "asc" ? 
        a.updatedBy.localeCompare(b.updatedBy) : 
        b.updatedBy.localeCompare(a.updatedBy);
    }
    return 0;
  });


  // Group by type for Type view
  const typeGroups = CONTENT_TYPES.map(type => ({
    name: type,
    totalItems: allItems.filter(item => {
      const edit = getEdit(item.id);
      if (edit?.deleted) {
        return false;
      }
      const displayData = getDisplayData(item);
      return item.type === type && (state.showArchived || !displayData.archived);
    }).length
  })).filter(group => group.totalItems > 0);

  // Group by strategy for Strategy view
  const strategyGroups = STRATEGIES.map(strategy => ({
    name: strategy,
    totalItems: allItems.filter(item => {
      const edit = getEdit(item.id);
      if (edit?.deleted) {
        return false;
      }
      const displayData = getDisplayData(item);
      const itemStrategy = Array.isArray(item.strategy) ? item.strategy : [item.strategy];
      return itemStrategy.includes(strategy) && (state.showArchived || !displayData.archived);
    }).length
  })).filter(group => group.totalItems > 0);

  // Get recent questions with sorting and filtering
  const recentQuestions = (() => {
    let filtered = allItems;
    
    // Filter out deleted items
    filtered = filtered.filter(item => {
      const edit = getEdit(item.id);
      return !edit?.deleted;
    });
    
    // Apply archived filter
    if (!state.showArchived) {
      filtered = filtered.filter(item => {
        const displayData = getDisplayData(item);
        return !displayData.archived;
      });
    }
    
    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (qaSortColumn) {
        case "question":
          comparison = a.question.localeCompare(b.question);
          break;
        case "lastModified":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      
      return qaSortDirection === "asc" ? comparison : -comparison;
    });
    
    return sorted.slice(0, 5);
  })();

  // Utility functions for QuestionCard
  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();

    // Guard: invalid or future dates -> "today"
    if (isNaN(date.getTime()) || date.getTime() > now.getTime()) {
      return "today";
    }

    // Diff in whole days using UTC to avoid DST issues
    const msPerDay = 24 * 60 * 60 * 1000;
    const toUtcMidnight = (d: Date) =>
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const diffInDays = Math.floor(
      (toUtcMidnight(now) - toUtcMidnight(date)) / msPerDay
    );

    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    if (diffInDays <= 31) {
      const weeks = Math.min(4, Math.max(1, Math.round(diffInDays / 7)));
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }

    // Helper: calendar diff in years & months (UTC)
    const diffYearsMonths = (from: Date, to: Date) => {
      let years = to.getUTCFullYear() - from.getUTCFullYear();
      let months = to.getUTCMonth() - from.getUTCMonth();
      const days = to.getUTCDate() - from.getUTCDate();

      if (days < 0) {
        months -= 1;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      return { years, months };
    };

    if (diffInDays < 365) {
      const { years, months } = diffYearsMonths(date, now);
      const m = years * 12 + Math.max(1, months); // ensure at least 1
      return m === 1 ? "1 month ago" : `${m} months ago`;
    }

    if (diffInDays < 380) return "1y ago";

    const { years, months } = diffYearsMonths(date, now);
    if (months > 0) {
      return `${years}y ${months}mo ago`;
    }
    return `${years}y ago`;
  };

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightSearchTerms = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #FEF3C7; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</mark>');
  };

  const handleCopyAnswer = async (answer: string) => {
    try {
      await navigator.clipboard.writeText(answer);
      toast({
        title: "Copied to clipboard",
        description: "The answer has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleAnswerExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedAnswers(newExpanded);
  };

  const toggleNestedExpansion = (itemId: string) => {
    const newNestedExpanded = new Set(nestedExpanded);
    if (newNestedExpanded.has(itemId)) {
      newNestedExpanded.delete(itemId);
    } else {
      newNestedExpanded.add(itemId);
    }
    setNestedExpanded(newNestedExpanded);
  };

  const expandCollapseAllNested = (expand: boolean) => {
    if (expand) {
      // Find all parent questions with children and expand them
      const allParentIds = new Set<string>();
      allItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          allParentIds.add(item.id);
        }
      });
      setNestedExpanded(allParentIds);
    } else {
      setNestedExpanded(new Set());
    }
  };

  // Helper to find original item including nested children
  const findOriginalItem = (itemId: string): QuestionItem | undefined => {
    // First try allItems (top-level items)
    let found = allItems.find(item => item.id === itemId);
    if (found) return found;
    
    // If not found, search nested children
    for (const doc of MOCK_CONTENT_ITEMS) {
      for (const item of doc.items) {
        if (item.id === itemId) {
          return item;
        }
        // Check children
        if (item.children) {
          for (const child of item.children) {
            if (child.id === itemId) {
              return child;
            }
          }
        }
      }
    }
    return undefined;
  };

  const handleEdit = (item: QuestionItem) => {
    // Find the original item (without edits) for comparison
    const originalItem = findOriginalItem(item.id);
    setEditingItem(item); // Store the display item (with edits)
    setEditingOriginalItem(originalItem || null); // Store the original item for comparison
  };

  const handleSave = (itemId: string, editData: any) => {
    // Use the original item we stored when editing started
    const originalItem = editingOriginalItem;
    if (!originalItem) {
      console.warn('handleSave: editingOriginalItem is null, itemId:', itemId);
    }
    saveEdit(itemId, editData, originalItem);
    setEditingItem(null);
    setEditingOriginalItem(null);
  };

  const handleViewHistory = (itemId: string, question: string, answer: string) => {
    setHistoryModalItemId(itemId);
    setHistoryModalQuestion(question);
    setHistoryModalAnswer(answer);
    setHistoryModalOpen(true);
  };

  const handleTagAdd = (id: string, tag: { type: string; value: string }) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || originalItem?.tags || [];
    
    // Check if tag already exists
    const tagExists = currentTags.some(t => t.type === tag.type && t.value === tag.value);
    if (!tagExists) {
      saveEdit(id, { ...currentEdit, tags: [...currentTags, tag] });
    }
  };

  const handleTagRemove = (id: string, tag: { type: string; value: string }) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || originalItem?.tags || [];
    
    saveEdit(id, { 
      ...currentEdit, 
      tags: currentTags.filter(t => !(t.type === tag.type && t.value === tag.value))
    });
  };


  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-sidebar-background flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <VaultSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background mt-4 ml-4 rounded-tl-2xl vault-scroll">
          <div className="flex-1 overflow-y-auto">
              {/* Main Content */}
              <div className="">
                {/* Header */}
                <div className="border-b border-foreground/10 bg-background">
                  <div className="flex items-center justify-between px-6 py-6 max-w-[100rem] mx-auto">
                    <h1 className="text-2xl font-semibold">Vault</h1>
                    
                    <div className="flex items-center gap-3">
                    <Button
                    variant="default"
                    onClick={() => navigate('/vault/add-content')}
                    className="text-sm"
                    >
                      + Add Content
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/vault/suggested-updates')}
                      className="text-sm"
                    >
                      AI Actions
                    </Button>
                    <Button 
                      onClick={() => setShowFindDuplicatesModal(true)}
                      className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-foreground/20 bg-background text-foreground text-sm font-medium leading-tight tracking-tight hover:border-foreground/20 hover:bg-sidebar-background transition-colors capitalize"
                    >
                      <Copy className="h-4 w-4 mr-2 text-foreground/70" />
                      Find duplicates
                    </Button>
                    <Button 
                      onClick={() => setShowFirmUpdatesModal(true)}
                      className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-foreground/20 bg-background text-foreground text-sm font-medium leading-tight tracking-tight hover:border-foreground/20 hover:bg-sidebar-background transition-colors capitalize"
                    >
                      <Building2 className="h-4 w-4 mr-2 text-foreground/70" />
                      Firm updates
                    </Button>
                  </div>
                </div>

                {/* Search Section */}
                <div id="search-section" className="bg-sidebar-background/50">
                  <div className="p-6 flex items-center gap-3 max-w-[100rem] mx-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70" />
                      <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search or filter my Vault..."
                        className="pl-10 pr-10 h-12"
                      />
                      {searchInput && (
                        <button
                          onClick={() => {
                            setSearchInput('');
                            setQuery('');
                            navigate('/vault');
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70 hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="xl"
                      onClick={() => setShowFiltersPanel(true)}
                      className="flex items-center gap-2 h-12 px-4"
                    >
                      <Filter className="h-4 w-4" />
                      Open Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="text-xs">
                          {totalFiltersCount}
                        </Badge>
                      )}
                    </Button>

                    <Button 
                      onClick={handleSearch}
                      className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 px-6 h-12 min-w-32"
                    >
                      Find
                    </Button>
                  </div>

                  {/* Active Filters and Controls - Only show when there's an active search */}
                  {hasActiveSearch && (
                    <div className="px-6 pb-2 flex items-center justify-between max-w-[100rem] mx-auto">
                      {/* Active Filters */}
                      {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-foreground/70">Active filters:</span>
                          {Object.entries(selectedTagFilters).map(([tagTypeName, values]) =>
                            values.map(value => (
                              <Badge key={`${tagTypeName}-${value}`} variant="secondary" className="gap-1">
                                {tagTypeName}: {value}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => {
                                    const newValues = values.filter(v => v !== value);
                                    if (newValues.length === 0) {
                                      const newFilters = { ...selectedTagFilters };
                                      delete newFilters[tagTypeName];
                                      setSelectedTagFilters(newFilters);
                                    } else {
                                      setSelectedTagFilters({ ...selectedTagFilters, [tagTypeName]: newValues });
                                    }
                                  }}
                                />
                              </Badge>
                            ))
                          )}
                          {selectedDocuments.map(document => (
                            <Badge key={document} variant="secondary" className="gap-1">
                              Document: {document}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                  setSelectedDocuments(prev => prev.filter(d => d !== document));
                                }}
                              />
                            </Badge>
                          ))}
                          {selectedDateRange && selectedDateRange.type !== 'any' && (
                            <Badge variant="secondary" className="gap-1">
                              Date: {selectedDateRange.type === 'custom' && selectedDateRange.from && selectedDateRange.to
                                ? `${format(selectedDateRange.from, 'MMM d')} - ${format(selectedDateRange.to, 'MMM d, yyyy')}`
                                : selectedDateRange.type === '7d' ? 'Past 7 days'
                                : selectedDateRange.type === '30d' ? 'Past 30 days'
                                : selectedDateRange.type === '3mo' ? 'Past 3 months'
                                : selectedDateRange.type === '6mo' ? 'Past 6 months'
                                : selectedDateRange.type === '1y' ? 'Past year'
                                : 'Date range'}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => setSelectedDateRange(null)}
                              />
                            </Badge>
                          )}
                          {selectedPriorSamples.map(sampleId => {
                            const sample = fileHistory.find(f => f.id === sampleId);
                            return sample ? (
                              <Badge key={sampleId} variant="secondary" className="gap-1">
                                Sample: {sample.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => {
                                    setSelectedPriorSamples(prev => prev.filter(id => id !== sampleId));
                                  }}
                                />
                              </Badge>
                            ) : null;
                          })}
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div id="page-content" className="flex-1">
                {hasActiveSearch || isFileMode ? (
                  /* Search Results */
                  <div className="h-full p-6 space-y-6 max-w-[100rem] mx-auto">
                    {/* Back Button */}
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Clear the file mode and navigate back to documents tab
                          navigate('/vault');
                        }}
                        className="flex items-center gap-2 text-foreground/70 hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Documents
                      </Button>
                    </div>
                    
                    {/* Results Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {sortedAndFilteredItems.length} {sortedAndFilteredItems.length === 1 ? 'Result' : 'Results'}
                          {isFileMode && fileName && ` from "${fileName}"`}
                          {state.query && !isFileMode && ` for "${state.query}"`}
                        </h2>
                        {hasActiveFilters && (
                          <p className="text-foreground/70 mt-1">
                            Filtered by {totalFiltersCount} criteria
                          </p>
                        )}
                      </div>
                      
                      {/* Sort and Show Archived Controls for Content Well */}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Sort: {currentSort === 'relevance' ? 'Relevance' : currentSort === 'lastEdited' ? 'Last edited' : 'Last editor'}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSortChange('relevance')}>
                              {currentSort === 'relevance' && <Check className="mr-2 h-4 w-4" />}
                              {currentSort !== 'relevance' && <div className="mr-6" />}
                              Relevance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('lastEdited')}>
                              {currentSort === 'lastEdited' && <Check className="mr-2 h-4 w-4" />}
                              {currentSort !== 'lastEdited' && <div className="mr-6" />}
                              Last edited
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('lastEditor')}>
                              {currentSort === 'lastEditor' && <Check className="mr-2 h-4 w-4" />}
                              {currentSort !== 'lastEditor' && <div className="mr-6" />}
                              Last editor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {state.showArchived && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteAllArchived}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Archived
                          </Button>
                        )}

                        <Button
                          variant={state.showArchived ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const newShowArchived = !state.showArchived;
                            setShowArchived(newShowArchived);
                            // Update URL parameters
                            const newParams = new URLSearchParams(searchParams);
                            if (newShowArchived) {
                              newParams.set('showArchived', 'true');
                            } else {
                              newParams.delete('showArchived');
                            }
                            navigate(`/vault?${newParams.toString()}`, { replace: true });
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          {state.showArchived ? "Hide archived" : "Show archived"}
                        </Button>

                        {/* Expand/Collapse All Nested Questions */}
                        {/* {hasNestedQuestions && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allExpanded = nestedExpanded.size > 0;
                              expandCollapseAllNested(!allExpanded);
                            }}
                          >
                            {nestedExpanded.size > 0 ? "Collapse All" : "Expand All"}
                          </Button>
                        )} */}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              Export Results
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportData('pdf')}>
                              PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportData('csv')}>
                              XLS/CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportData('docx')}>
                              Word (.docx)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {sortedAndFilteredItems.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-lg text-foreground/70 mb-4">
                          No results match your search and filters.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setSearchInput('');
                            setQuery('');
                            navigate('/vault');
                          }}>
                            Clear search
                          </Button>
                        </div>
                      </div>
                    ) : (
                      sortedAndFilteredItems.map((item, index) => {
                        const hasEdits = !!getEdit(item.id);
                        const isExpanded = expandedAnswers.has(item.id);
                        const displayData = getDisplayData(item);
                        
                        return (
                          <QuestionCard
                            key={item.id}
                            item={{
                              ...item, 
                              ...displayData,
                              isExpanded: nestedExpanded.has(item.id)
                            }}
                            query={searchInput}
                            fileName={fileName}
                            hasEdits={hasEdits}
                            isExpanded={isExpanded}
                            showBestAnswerTag={true}
                            onToggleExpansion={toggleNestedExpansion}
                            onEdit={handleEdit}
                            onCopyAnswer={handleCopyAnswer}
                            onTagRemove={handleTagRemove}
                            onTagAdd={handleTagAdd}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onViewHistory={handleViewHistory}
                            highlightSearchTerms={highlightSearchTerms}
                            formatRelativeTime={formatRelativeTime}
                            formatFullDate={formatFullDate}
                          />
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* Main Tabs */
                  <div id="documents-recent-tabs" className="h-full p-6 max-w-[100rem] mx-auto">
                  {/* Main Tabs - Custom Styling */}
                  <div className="flex items-center gap-8 mb-6 border-b border-foreground/10">
                    <button
                      onClick={() => handleTabChange("documents")}
                      className={`flex items-center gap-2 pb-4 text-lg font-medium transition-colors ${
                        activeTab === "documents"
                          ? "text-foreground border-b-2 border-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <FolderOpen className="h-5 w-5" />
                      Documents
                    </button>
                    <button
                      onClick={() => handleTabChange("recent")}
                      className={`flex items-center gap-2 pb-4 text-lg font-medium transition-colors ${
                        activeTab === "recent"
                          ? "text-foreground border-b-2 border-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      Recent Q&A
                    </button>
                  </div>

                  {/* Recent Q&A Content */}
                  {activeTab === "recent" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">Recent Questions</h2>
                          <p className="text-foreground/70">Most recently edited questions and answers</p>
                        </div>
                      </div>
                      
                      <SortAndArchiveControls
                        sortColumn={qaSortColumn}
                        sortDirection={qaSortDirection}
                        onSortChange={handleQaSortChange}
                        showArchived={state.showArchived}
                        onShowArchivedChange={(newShowArchived) => {
                          setShowArchived(newShowArchived);
                          // Update URL parameters
                          const newParams = new URLSearchParams(searchParams);
                          if (newShowArchived) {
                            newParams.set('showArchived', 'true');
                          } else {
                            newParams.delete('showArchived');
                          }
                          navigate(`/vault?${newParams.toString()}`, { replace: true });
                        }}
                        sortOptions={[
                          { value: "name", label: "Name" },
                          { value: "lastEdited", label: "Date Last Edited" },
                          { value: "lastEditor", label: "Last Editor" }
                        ]}
                        title="Recent Questions"
                      />

                      {/* Recent Question Cards */}
                      <div className="space-y-4">
                        {recentQuestions.map((item) => {
                          const hasEdits = !!getEdit(item.id);
                          const isExpanded = expandedAnswers.has(item.id);
                          const displayData = getDisplayData(item);
                          
                          return (
                            <QuestionCard
                              key={item.id}
                              item={{...item, ...displayData}}
                              showBestAnswerTag={false}
                              hasEdits={hasEdits}
                              isExpanded={isExpanded}
                              onToggleExpansion={toggleAnswerExpansion}
                              onEdit={handleEdit}
                              onCopyAnswer={handleCopyAnswer}
                              onTagRemove={handleTagRemove}
                              onTagAdd={handleTagAdd}
                              onArchive={handleArchive}
                              onDelete={handleDelete}
                              onViewHistory={handleViewHistory}
                              highlightSearchTerms={highlightSearchTerms}
                              formatRelativeTime={formatRelativeTime}
                              formatFullDate={formatFullDate}
                            />
                          );
                        })}
                        {recentQuestions.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-lg text-foreground/70 mb-4">
                              No recent questions found.
                            </p>
                            <Button variant="outline" onClick={() => {
                                  setSearchInput('');
                                  setQuery('');
                                  setSelectedTagFilters({});
                                  navigate('/vault');
                            }}>
                              Browse All Questions
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents Content */}
                  {activeTab === "documents" && (
                    <div className="space-y-6">
                    {/* Document View Tabs */}
                    <Tabs value={state.activeView} onValueChange={(value) => handleDocumentsTabChange(value as "files" | "type" | "strategy" | "data")}>
                      <TabsList className="inline-flex w-fit bg-transparent p-0 h-auto gap-2">
                        <TabsTrigger 
                          value="files"
                          className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-foreground/70 bg-transparent hover:bg-foreground/5 hover:text-[#09090B] data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Files
                        </TabsTrigger>
                        <TabsTrigger 
                          value="type"
                          className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-foreground/70 bg-transparent hover:bg-foreground/5 hover:text-[#09090B] data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
                        >
                          <Shapes className="h-4 w-4" />
                          Type
                        </TabsTrigger>
                        <TabsTrigger 
                          value="strategy"
                          className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-foreground/70 bg-transparent hover:bg-foreground/5 hover:text-[#09090B] data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
                        >
                          <Lightbulb className="h-4 w-4" />
                          Strategy
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="files" className="mt-6">
                        <div className="space-y-4">
                          <SortAndArchiveControls
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSortChange={handleFilesSortChange}
                            showArchived={state.showArchived}
                            onShowArchivedChange={(newShowArchived) => {
                              setShowArchived(newShowArchived);
                              // Update URL parameters
                              const newParams = new URLSearchParams(searchParams);
                              if (newShowArchived) {
                                newParams.set('showArchived', 'true');
                              } else {
                                newParams.delete('showArchived');
                              }
                              navigate(`/vault?${newParams.toString()}`, { replace: true });
                            }}
                            sortOptions={[
                              { value: "name", label: "Name" },
                              { value: "totalItems", label: "Number of Items" },
                              { value: "lastEdited", label: "Date Last Edited" },
                              { value: "lastEditor", label: "Last Editor" }
                            ]}
                            title="Files"
                          />

                          <div className="grid gap-2">
                            {sortedFiles.map((file, index) => (
                              <div
                                key={file.documentId}
                                className={`group flex items-center justify-between px-4 py-3 border border-foreground/10 rounded-lg hover:bg-sidebar-background transition cursor-pointer ${
                                  index % 2 === 0 ? 'bg-sidebar-background/10' : 'bg-sidebar-background/70'
                                }`}
                                
                                onClick={() => {
                                  // Set the file mode state
                                  setSearchInput('');
                                  setQuery('');
                                  setSelectedStrategy([]);
                                  setSelectedType([]);
                                  setSelectedTags([]);
                                  setSelectedStatus([]);
                                  
                                  // Update URL to show file mode
                                  const params = new URLSearchParams();
                                  params.set('fileName', file.name);
                                  params.set('count', file.totalItems.toString());
                                  navigate(`/vault?${params.toString()}`);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-foreground/70" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{file.name}</h4>
                                      {isFileArchived(file.name) && (
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background text-foreground">
                                          <Archive className="h-3 w-3" />
                                          <span className="text-xs font-semibold">Archived</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="inline-flex items-center rounded-full border border-foreground/10 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                        {file.totalItems} {file.totalItems === 1 ? "item" : "items"}
                                      </div>
                                      <div className="inline-flex items-center rounded-full border border-foreground/10 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                        {file.type}
                                      </div>
                                      <div className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                        <span style={{ color: '#71717A' }}>Last edited</span> {formatRelativeTime(file.updatedAt)} <span style={{ color: '#71717A' }}>by</span> {file.updatedBy}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFileArchive(file.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-background transition text-foreground/70 hover:text-foreground text-sm"
                                    title={isFileArchived(file.name) ? "Restore all items in this file" : "Archive all items in this file"}
                                  >
                                    <Archive className="h-4 w-4" />
                                    {isFileArchived(file.name) ? "Restore" : "Archive All"}
                                  </button>
                                  <ChevronRight className="h-4 w-4 text-foreground/70" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="type" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Content Types</h3>
                          <div className="grid gap-2">
                            {typeGroups.map((type) => (
                              <div
                                key={type.name}
                                className="group flex items-center justify-between px-4 py-3 border border-foreground/10 rounded-lg hover:bg-foreground/5 transition cursor-pointer"
                                onClick={() => {
                                  setSelectedTagFilters({ 'Type': [type.name] });
                                  setSearchInput('');
                                  setQuery('');
                                  const params = new URLSearchParams();
                                  params.set('type', type.name);
                                  navigate(`/vault?${params.toString()}`);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Shapes className="h-5 w-5 text-foreground/70" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{type.name}</h4>
                                      {isTypeArchived(type.name) && (
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background text-foreground">
                                          <Archive className="h-3 w-3" />
                                          <span className="text-xs font-semibold">Archived</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 inline-flex items-center rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                      {type.totalItems} {type.totalItems === 1 ? "item" : "items"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTypeArchive(type.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-background transition text-foreground/70 hover:text-foreground text-sm"
                                    title={isTypeArchived(type.name) ? "Restore all items of this type" : "Archive all items of this type"}
                                  >
                                    <Archive className="h-4 w-4" />
                                    {isTypeArchived(type.name) ? "Restore" : "Archive All"}
                                  </button>
                                  <ChevronRight className="h-4 w-4 text-foreground/70" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="strategy" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Investment Strategies</h3>
                          <div className="grid gap-2">
                            {strategyGroups.map((group) => (
                              <div
                                key={group.name}
                                className="group flex items-center justify-between px-4 py-3 border border-foreground/10 rounded-lg hover:bg-foreground/5 transition cursor-pointer"
                                onClick={() => {
                                  setSelectedTagFilters({ 'Strategy': [group.name] });
                                  setSearchInput('');
                                  setQuery('');
                                  const params = new URLSearchParams();
                                  params.set('strategy', group.name);
                                  navigate(`/vault?${params.toString()}`);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Lightbulb className="h-5 w-5 text-foreground/70" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{group.name}</h4>
                                      {isStrategyArchived(group.name) && (
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background text-foreground">
                                          <Archive className="h-3 w-3" />
                                          <span className="text-xs font-semibold">Archived</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 inline-flex items-center rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                      {group.totalItems} {group.totalItems === 1 ? "item" : "items"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStrategyArchive(group.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-background transition text-foreground/70 hover:text-foreground text-sm"
                                    title={isStrategyArchived(group.name) ? "Restore all items of this strategy" : "Archive all items of this strategy"}
                                  >
                                    <Archive className="h-4 w-4" />
                                    {isStrategyArchived(group.name) ? "Restore" : "Archive All"}
                                  </button>
                                  <ChevronRight className="h-4 w-4 text-foreground/70" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      {editingItem && (
        <VaultEditSheet
          item={editingItem}
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(editData) => handleSave(editingItem.id, editData)}
          existingEdit={getEdit(editingItem.id)}
        />
      )}

      {/* Modals */}
      <FirmUpdatesModal
        open={showFirmUpdatesModal}
        onClose={() => setShowFirmUpdatesModal(false)}
      />
      
      <FindDuplicatesModal
        open={showFindDuplicatesModal}
        onClose={() => setShowFindDuplicatesModal(false)}
      />
      
      <SmartUploadSheet
        open={showSmartUploadSheet}
        onClose={() => setShowSmartUploadSheet(false)}
      />
      
      <FiltersPanel
        isOpen={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        selectedTagFilters={selectedTagFilters}
        onTagFiltersChange={setSelectedTagFilters}
        selectedDocuments={selectedDocuments}
        onDocumentsChange={setSelectedDocuments}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
        selectedPriorSamples={selectedPriorSamples}
        onPriorSamplesChange={setSelectedPriorSamples}
        priorSamples={fileHistory}
        onClearAll={clearFilters}
        showDocumentNames={false}
      />

      {/* Delete Confirmation Dialog for Individual Item */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete "{itemToDelete?.question}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Archived Confirmation Dialog */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Archived Items</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete {sortedAndFilteredItems.filter(item => {
                const displayData = getDisplayData(item);
                return displayData.archived;
              }).length} archived item(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAllArchived}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change History Modal */}
      <ChangeHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        itemId={historyModalItemId || ''}
        currentQuestion={historyModalQuestion}
        currentAnswer={historyModalAnswer}
      />
    </div>
  );
}