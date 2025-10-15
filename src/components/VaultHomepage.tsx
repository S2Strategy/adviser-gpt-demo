import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { QuestionCard } from "./QuestionCard";
import { VaultEditSheet } from "./VaultEditSheet";
import { FirmUpdatesModal } from "./FirmUpdatesModal";
import { FindDuplicatesModal } from "./FindDuplicatesModal";
import { SmartUploadSheet } from "./SmartUploadSheet";
import { SaveSearchPrompt } from "./SaveSearchPrompt";
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
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, TAGS_INFO, QuestionItem } from "@/types/vault";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { smartSearch, getSemanticVariations, getSearchSuggestions } from "@/utils/smartSearch";

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
  
  // Sync state.query with URL query parameter
  useEffect(() => {
    if (urlQuery !== state.query) {
      setQuery(urlQuery);
    }
  }, [urlQuery, setQuery]);

  // Sync filter states with URL parameters
  useEffect(() => {
    const urlStrategy = searchParams.get('strategy')?.split(',').filter(Boolean) || [];
    const urlType = searchParams.get('type')?.split(',').filter(Boolean) || [];
    const urlTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const urlStatus = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const urlShowArchived = searchParams.get('showArchived') === 'true';
    
    setSelectedStrategy(urlStrategy);
    setSelectedType(urlType);
    setSelectedTags(urlTags);
    setSelectedStatus(urlStatus);
    setSearchInput(urlQuery);
    
    // Sync showArchived with URL parameter
    if (urlShowArchived !== state.showArchived) {
      setShowArchived(urlShowArchived);
    }
  }, [searchParams, urlQuery]);
  const [selectedStrategy, setSelectedStrategy] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
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
  const [activeTab, setActiveTab] = useState<"recent" | "documents">("recent");
  const [showFirmUpdatesModal, setShowFirmUpdatesModal] = useState(false);
  const [showFindDuplicatesModal, setShowFindDuplicatesModal] = useState(false);
  const [showSmartUploadSheet, setShowSmartUploadSheet] = useState(false);

  // Load saved tab state from localStorage
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
  }, []);

  // Initialize state from URL parameters
  useEffect(() => {
    setSearchInput(urlQuery);
    setSelectedStrategy(searchParams.get('strategy')?.split(',').filter(Boolean) || []);
    setSelectedType(searchParams.get('type')?.split(',').filter(Boolean) || []);
    setSelectedStatus(searchParams.get('status')?.split(',').filter(Boolean) || []);
    setSelectedTags(searchParams.get('tags')?.split(',').filter(Boolean) || []);
  }, [urlQuery, searchParams]);

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

  // Flatten the nested data structure for processing
  const flattenItems = (): QuestionItem[] => {
    if (isFileMode && fileName) {
      // In file mode, only show items from the specific file
      const targetDoc = MOCK_CONTENT_ITEMS.find(doc => doc.title === fileName);
      if (targetDoc) {
        return targetDoc.items.map(item => ({
          ...item,
          documentTitle: targetDoc.title,
          documentId: targetDoc.id
        }));
      }
      return []; // File not found
    }
    
    // In search mode, show all items
    return MOCK_CONTENT_ITEMS.flatMap(doc => 
      doc.items.map(item => ({
        ...item,
        documentTitle: doc.title,
        documentId: doc.id
      }))
    );
  };

  const allItems = flattenItems();

  // Helper function to normalize strategies (convert single string to array)
  const normalizeStrategies = (strategy: string | string[]): string[] => {
    return Array.isArray(strategy) ? strategy : [strategy];
  };

  // Helper function to merge original item with saved edits
  const getDisplayData = (item: QuestionItem) => {
    const savedEdit = getEdit(item.id);
    if (!savedEdit) return item;

    const result = {
      ...item,
      question: savedEdit.question || item.question,
      answer: savedEdit.answer || item.answer,
      strategy: savedEdit.strategy || item.strategy,
      tags: savedEdit.tags || item.tags,
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

  // Only perform search when explicitly triggered (not on every keystroke)
  const smartSearchResults = state.query ? smartSearch(allItems, state.query) : allItems;
  
  // Apply additional filters to smart search results
  const filteredItems = smartSearchResults.filter(item => {
    const displayData = getDisplayData(item);
    
    // Filter out archived items unless showArchived is true
    if (!state.showArchived && displayData.archived) {
      return false;
    }
    
    const itemStrategies = normalizeStrategies(displayData.strategy);
    const matchesStrategy = selectedStrategy.length === 0 || 
      selectedStrategy.some(selectedStrategy => itemStrategies.includes(selectedStrategy));
    const matchesType = selectedType.length === 0 || 
      selectedType.includes(displayData.type);
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => displayData.tags.includes(tag));
    const matchesStatus = selectedStatus.length === 0 || 
      selectedStatus.includes(displayData.type); // Using type as status for mock data
    
    return matchesStrategy && matchesType && matchesTags && matchesStatus;
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

  const hasActiveFilters = selectedStrategy.length > 0 || selectedType.length > 0 || selectedTags.length > 0 || selectedStatus.length > 0;
  const hasActiveSearch = (state.query && state.query.trim()) || hasActiveFilters;
  
  // Check if there are any parent questions with children
  const hasNestedQuestions = allItems.some(item => item.children && item.children.length > 0);

  const handleSearch = () => {
    // Check if there's search text or any filters selected
    const hasSearchText = searchInput.trim();
    const hasFilters = selectedStrategy.length > 0 || selectedType.length > 0 || selectedTags.length > 0 || selectedStatus.length > 0;
    
    if (hasSearchText || hasFilters) {
      setQuery(searchInput);
      setFilters({
        strategy: selectedStrategy.length > 0 ? selectedStrategy[0] : undefined,
        contentType: selectedType.length > 0 ? selectedType[0] : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        status: selectedStatus.length > 0 ? selectedStatus[0] : undefined
      });
      
      // Add to search history
      addToHistory(searchInput, {
        strategies: selectedStrategy,
        types: selectedType,
        tags: selectedTags,
        statuses: selectedStatus
      }, currentSort);
      
      // Update URL parameters without navigating away from homepage
      const params = new URLSearchParams();
      // Only set query param if there's actual search text
      if (hasSearchText) {
        params.set('query', searchInput);
      }
      if (selectedStrategy.length > 0) params.set('strategy', selectedStrategy.join(','));
      if (selectedType.length > 0) params.set('type', selectedType.join(','));
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (selectedStatus.length > 0) params.set('status', selectedStatus.join(','));
      
      // Update URL using React Router navigation
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
    setSelectedStrategy([]);
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedTags([]);
    
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
        title: (item as any).documentTitle || 'Unknown Document',
        answer: item.answer || '',
        question: item.question || '',
        fileName: (item as any).documentTitle || 'Unknown Document',
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
    // Filter out archived items unless showArchived is true
    const visibleItems = doc.items.filter(item => {
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
      const displayData = getDisplayData(item);
      return item.type === type && (state.showArchived || !displayData.archived);
    }).length
  })).filter(group => group.totalItems > 0);

  // Group by strategy for Strategy view
  const strategyGroups = STRATEGIES.map(strategy => ({
    name: strategy,
    totalItems: allItems.filter(item => {
      const displayData = getDisplayData(item);
      const itemStrategy = Array.isArray(item.strategy) ? item.strategy : [item.strategy];
      return itemStrategy.includes(strategy) && (state.showArchived || !displayData.archived);
    }).length
  })).filter(group => group.totalItems > 0);

  // Get recent questions with sorting and filtering
  const recentQuestions = (() => {
    let filtered = allItems;
    
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
      let days = to.getUTCDate() - from.getUTCDate();

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

  const handleEdit = (item: QuestionItem) => {
    setEditingItem(item);
  };

  const handleSave = (itemId: string, editData: any) => {
    saveEdit(itemId, editData);
    setEditingItem(null);
  };

  const handleTagAdd = (id: string, tag: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentTags = currentEdit.tags || originalItem?.tags || [];
    
    if (!currentTags.includes(tag)) {
      saveEdit(id, { ...currentEdit, tags: [...currentTags, tag] });
    }
  };

  const handleTagRemove = (id: string, tag: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentTags = currentEdit.tags || originalItem?.tags || [];
    
    saveEdit(id, { ...currentEdit, tags: currentTags.filter(t => t !== tag) });
  };

  const handleStrategyRemove = (id: string, strategyToRemove: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentStrategies = normalizeStrategies(currentEdit.strategy || originalItem?.strategy || []);
    
    const updatedStrategies = currentStrategies.filter(s => s !== strategyToRemove);
    saveEdit(id, { ...currentEdit, strategy: updatedStrategies });
  };

  const handleStrategyAdd = (id: string, strategy: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentStrategies = normalizeStrategies(currentEdit.strategy || originalItem?.strategy || []);
    
    if (!currentStrategies.includes(strategy)) {
      saveEdit(id, { ...currentEdit, strategy: [...currentStrategies, strategy] });
    }
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
                    <Button 
                      onClick={() => setShowSmartUploadSheet(true)}
                      className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-foreground/20 bg-background text-foreground text-sm font-medium leading-tight tracking-tight hover:border-foreground/20 hover:bg-sidebar-background transition-colors capitalize"
                    >
                      <MessagesSquare className="h-4 w-4 mr-2 text-foreground/70" />
                      Add QA Pair
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
                    
                    <MultiSelectFilter
                      title="Strategies"
                      options={STRATEGIES}
                      selectedValues={selectedStrategy}
                      onSelectionChange={setSelectedStrategy}
                      placeholder="Strategies"
                      size="xl"
                    />

                    <MultiSelectFilter
                      title="Types"
                      options={CONTENT_TYPES}
                      selectedValues={selectedType}
                      onSelectionChange={setSelectedType}
                      placeholder="Types"
                      size="xl"
                    />

                    <MultiSelectFilter
                      title="Tags"
                      options={TAGS_INFO.map(tag => tag.name)}
                      selectedValues={selectedTags}
                      onSelectionChange={setSelectedTags}
                      placeholder="Tags"
                      size="xl"
                    />

                    <Button 
                      onClick={handleSearch}
                      className="bg-foreground text-background hover:bg-foreground/80 px-6 h-12 min-w-32"
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
                          {selectedStrategy.map(strategy => (
                            <Badge key={strategy} variant="secondary" className="gap-1">
                              Strategy: {strategy}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                  const newStrategies = selectedStrategy.filter(s => s !== strategy);
                                  setSelectedStrategy(newStrategies);
                                }}
                              />
                            </Badge>
                          ))}
                          {selectedType.map(type => (
                            <Badge key={type} variant="secondary" className="gap-1">
                              Type: {type}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                  const newTypes = selectedType.filter(t => t !== type);
                                  setSelectedType(newTypes);
                                }}
                              />
                            </Badge>
                          ))}
                          {selectedStatus.map(status => (
                            <Badge key={status} variant="secondary" className="gap-1">
                              Status: {status}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                  const newStatuses = selectedStatus.filter(s => s !== status);
                                  setSelectedStatus(newStatuses);
                                }}
                              />
                            </Badge>
                          ))}
                          {selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              Tag: {tag}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                  const newTags = selectedTags.filter(t => t !== tag);
                                  setSelectedTags(newTags);
                                }}
                              />
                            </Badge>
                          ))}
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
                            Filtered by {selectedStrategy.length + selectedType.length + selectedTags.length + selectedStatus.length} criteria
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
                        {hasNestedQuestions && (
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
                        )}

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
                            onStrategyRemove={handleStrategyRemove}
                            onStrategyAdd={handleStrategyAdd}
                            onTagRemove={handleTagRemove}
                            onTagAdd={handleTagAdd}
                            onArchive={handleArchive}
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
                              onStrategyRemove={handleStrategyRemove}
                              onStrategyAdd={handleStrategyAdd}
                              onTagRemove={handleTagRemove}
                              onTagAdd={handleTagAdd}
                              onArchive={handleArchive}
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
                              setSelectedStrategy([]);
                              setSelectedType([]);
                              setSelectedTags([]);
                              setSelectedStatus([]);
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
                                className="group flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedType([type.name]);
                                  setSearchInput('');
                                  setQuery('');
                                  setSelectedStrategy([]);
                                  setSelectedTags([]);
                                  setSelectedStatus([]);
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
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                          <Archive className="h-3 w-3" />
                                          <span className="text-xs font-semibold">Archived</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
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
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 text-foreground/70 hover:text-foreground text-sm"
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
                                className="group flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedStrategy([group.name]);
                                  setSearchInput('');
                                  setQuery('');
                                  setSelectedType([]);
                                  setSelectedTags([]);
                                  setSelectedStatus([]);
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
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                          <Archive className="h-3 w-3" />
                                          <span className="text-xs font-semibold">Archived</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
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
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 text-foreground/70 hover:text-foreground text-sm"
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
    </div>
  );
}