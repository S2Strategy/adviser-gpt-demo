import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { QuestionCard } from "./QuestionCard";
import { FirmUpdatesModal } from "./FirmUpdatesModal";
import { FindDuplicatesModal } from "./FindDuplicatesModal";
import { SmartUploadSheet } from "./SmartUploadSheet";
import { SaveSearchPrompt } from "./SaveSearchPrompt";
import { ChangeHistoryModal } from "./ChangeHistoryModal";
import { QADetailModal } from "./QADetailModal";
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
  ArrowDown,
  ArrowUp,
  Shapes,
  Lightbulb,
  Database,
  Clock,
  FolderOpen,
  X,
  Check,
  Archive,
  ArchiveRestore,
  Filter,
  Trash2,
  Download,
  ExternalLink,
  Eye,
  Megaphone,
  LayoutGrid,
  List,
  Table as TableIcon,
  Edit,
  Tag as TagIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useTagTypes } from "@/hooks/useTagTypes";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, TAGS_INFO, QuestionItem, Tag, getQuarterOptions, formatQuarter, getQuarterFromString, getCurrentQuarter } from "@/types/vault";
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
  const { getAllTagTypes, getTagTypeValues } = useTagTypes();
  const { profile } = useUserProfile();
  
  // Extract URL parameters (fallback to window.location when router is stale after navigate())
  const location = useLocation();
  const sp = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fromRouter = (sp.get("query") || "").trim();
  const fromWindow = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("query") || "").trim() : "";
  const effectiveQuery = fromRouter || fromWindow;
  const fileName = searchParams.get('fileName');
  const fileCount = parseInt(searchParams.get('count') || '0');
  const isFileMode = !!fileName && effectiveQuery.length === 0;

  // Search and filter state
  const [searchInput, setSearchInput] = useState(effectiveQuery);
  
  const allowClearFromUrlRef = useRef(false);
  
  // Sync state.query with URL query parameter (only when URL changes, not when state changes).
  // When urlQuery is '' but the browser URL has ?query=..., use window.location as fallback.
  // Refuse to clear state when urlQuery is '' unless we explicitly requested it (Back to Documents,
  // X, or Clear search) so we avoid overwriting from spurious navigations to /vault.
  useEffect(() => {
    const queryFromUrl = (new URLSearchParams(location.search).get("query") || "").trim();
  
    // Don’t clear state.query unless we explicitly allowed it (Back to Docs, X, Clear search)
    if (
      queryFromUrl === "" &&
      (state.query || "").trim().length > 0 &&
      !allowClearFromUrlRef.current
    ) {
      return;
    }
  
    if (queryFromUrl !== (state.query || "")) {
      if (queryFromUrl === "" && allowClearFromUrlRef.current) {
        allowClearFromUrlRef.current = false;
      }
      setQuery(queryFromUrl);
    }
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, setQuery]);
  

  // Sync filter states with URL parameters (only when URL changes)
  useEffect(() => {
    const queryFromUrl = (new URLSearchParams(location.search).get("query") || "").trim();
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
    setSearchInput(prev => (prev === queryFromUrl ? prev : queryFromUrl));
    
    // Sync showArchived with URL parameter (only if different to avoid loops)
    if (urlShowArchived !== state.showArchived) {
      setShowArchived(urlShowArchived);
    }
    // Only depend on searchParams and urlQuery, not state, to avoid circular updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, setShowArchived]);
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
  
  const currentSort = searchParams.get('sort') || state.sort || 'lastUpdated';
  
  // Q&A Pairs list state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [qaSortColumn, setQaSortColumn] = useState<'question' | 'answer' | 'document' | 'lastUpdated' | null>('lastUpdated');
  const [qaSortDirection, setQaSortDirection] = useState<"asc" | "desc">("desc");
  const [lastUpdatedSortDirection, setLastUpdatedSortDirection] = useState<"asc" | "desc">("desc");
  const [qaViewMode, setQaViewMode] = useState<"table" | "list" | "grid">(() => {
    const saved = localStorage.getItem('vault-qa-view-mode');
    return (saved === "table" || saved === "list" || saved === "grid") ? saved : "table";
  });
  
  const qaContentRef = useRef<HTMLDivElement>(null);
  const [qaContentBounds, setQaContentBounds] = useState<{ left: number; width: number } | null>(null);
  
  // UI state
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [nestedExpanded, setNestedExpanded] = useState<Set<string>>(new Set());
  // Unified QA Modal state
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaModalItem, setQaModalItem] = useState<QuestionItem | null>(null);
  const [qaModalMode, setQaModalMode] = useState<'view' | 'edit'>('view');
  const [qaModalOpenedInMode, setQaModalOpenedInMode] = useState<'view' | 'edit'>('view');
  type VaultTab = "documents" | "documents-list";
  const ACTIVE_TAB_KEY = "vault-homepage-active-tab";
  const [activeTab, setActiveTab] = useState<VaultTab>(() => {
    if (typeof window === "undefined") return "documents";
    const saved = window.localStorage.getItem(ACTIVE_TAB_KEY);
    return saved === "documents" || saved === "documents-list" ? (saved as VaultTab) : "documents";
  });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [documentViewMode, setDocumentViewMode] = useState<"quarter" | "type">("quarter");
  const [quarterAssignDocument, setQuarterAssignDocument] = useState<{ name: string; currentQuarter?: string } | null>(null);
  const [quarterAssignSelected, setQuarterAssignSelected] = useState<string>("unassigned");
  const [collapsedDocSections, setCollapsedDocSections] = useState<Set<string>>(new Set());
  const [quarterPopoverDocName, setQuarterPopoverDocName] = useState<string | null>(null);
  
  const hasActiveFilters = Object.values(selectedTagFilters).some(values => values.length > 0) ||
                           selectedDocuments.length > 0 || selectedPriorSamples.length > 0 || 
                           (selectedDateRange && selectedDateRange.type !== 'any');

  // Redirect /vault?query=... (or any search params) to /search so search results live on dedicated route
  useEffect(() => {
    if (location.pathname !== '/vault') return;
    const params = new URLSearchParams(location.search);
    const hasSearchParams = (params.get('query') || '').trim() !== '' ||
      params.has('strategy') || params.has('type') || params.has('tags') || params.has('status') ||
      params.has('showArchived') || params.has('sort');
    if (hasSearchParams) {
      navigate(`/search?${location.search}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Update Q&A content bounds for floating bar positioning (Q&A Pairs tab only)
  useEffect(() => {
    const updateBounds = () => {
      if (qaContentRef.current && activeTab === "documents") {
        const rect = qaContentRef.current.getBoundingClientRect();
        setQaContentBounds({
          left: rect.left,
          width: rect.width,
        });
      } else {
        setQaContentBounds(null);
      }
    };
    const timeoutId = setTimeout(updateBounds, 0);
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [activeTab]);
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

    // Load saved documents sub-tab state
    const savedDocumentsTab = localStorage.getItem('vault-homepage-documents-tab');
    if (savedDocumentsTab && ["files", "type", "strategy", "data"].includes(savedDocumentsTab)) {
      setActiveView(savedDocumentsTab as "files" | "type" | "strategy" | "data");
    }
  }, [setActiveView]);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('vault-qa-view-mode', qaViewMode);
  }, [qaViewMode]);

  // // Initialize state from URL parameters
  // useEffect(() => {
  //   setSearchInput(urlQuery);
  //   // Legacy URL params are handled in the other useEffect
  // }, [urlQuery]);

  // Save tab state to localStorage when it changes
  const handleTabChange = (tab: "documents" | "documents-list") => {
    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
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

  // Handle Last Updated sort toggle
  const handleLastUpdatedSortToggle = () => {
    setLastUpdatedSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };
  
  // Handle item selection toggle
  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
    } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === sortedAndFilteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedAndFilteredItems.map(item => item.id)));
    }
  };
  
  // Handle showing answer detail in modal

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
      updatedAt: savedEdit.updatedAt || item.updatedAt,
      updatedBy: savedEdit.updatedBy || item.updatedBy,
      strategy: savedEdit.strategy || item.strategy, // Keep for backward compatibility
      tags, // Use migrated tags
      archived: savedEdit.archived !== undefined ? savedEdit.archived : (item.archived || false),
      quarter: savedEdit.quarter !== undefined ? savedEdit.quarter : item.quarter,
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

  // Assign or update quarter for all items in a document
  const applyQuarterToDocument = (documentTitle: string, newQuarter: string | undefined) => {
    const docItems = allItems.filter(item => item.documentTitle === documentTitle);
    if (docItems.length === 0) return;
    const entries: Array<[string, { quarter?: string }]> = docItems.map(item => [
      item.id,
      { quarter: newQuarter },
    ]);
    saveManyEdits(entries);
    toast({
      title: "Quarter updated",
      description: `"${documentTitle}" is now ${newQuarter ? formatQuarter(newQuarter) : "Unassigned"}.`,
    });
  };

  const handleAssignQuarter = () => {
    if (!quarterAssignDocument) return;
    const newQuarter = quarterAssignSelected === "unassigned" ? undefined : quarterAssignSelected;
    applyQuarterToDocument(quarterAssignDocument.name, newQuarter);
    setQuarterAssignDocument(null);
    setQuarterAssignSelected("unassigned");
  };

  // Open quarter assignment dialog for a document
  const openQuarterAssignDialog = (doc: { name: string; quarter?: string }) => {
    setQuarterAssignDocument({ name: doc.name, currentQuarter: doc.quarter });
    setQuarterAssignSelected(doc.quarter ?? "unassigned");
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

  const queryForSearch = effectiveQuery;
  // Only perform search when explicitly triggered (not on every keystroke)
  const smartSearchResults = queryForSearch ? smartSearch(allItems, queryForSearch) : allItems;
  
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

  // Handle column sort for Q&A Pairs table
  const handleColumnSort = (column: 'question' | 'answer' | 'document' | 'lastUpdated') => {
    if (qaSortColumn === column) {
      // Toggle direction if same column
      setQaSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setQaSortColumn(column);
      setQaSortDirection('asc');
    }
  };

  // Sort filtered items
  const sortItems = (items: QuestionItem[], sortBy: string | null, direction: "asc" | "desc") => {
    if (!sortBy) return items;
    
    switch (sortBy) {
      case 'lastUpdated':
      case 'lastEdited':
        return [...items].sort((a, b) => {
          const aTime = new Date(a.updatedAt).getTime();
          const bTime = new Date(b.updatedAt).getTime();
          return direction === "desc" ? bTime - aTime : aTime - bTime;
        });
      case 'question':
        return [...items].sort((a, b) => {
          const aQuestion = (a.question || '').toLowerCase();
          const bQuestion = (b.question || '').toLowerCase();
          return direction === "desc" 
            ? bQuestion.localeCompare(aQuestion)
            : aQuestion.localeCompare(bQuestion);
        });
      case 'answer':
        return [...items].sort((a, b) => {
          const displayDataA = getDisplayData(a);
          const displayDataB = getDisplayData(b);
          const aAnswer = (displayDataA.answer || '').toLowerCase();
          const bAnswer = (displayDataB.answer || '').toLowerCase();
          return direction === "desc"
            ? bAnswer.localeCompare(aAnswer)
            : aAnswer.localeCompare(bAnswer);
        });
      case 'document':
        return [...items].sort((a, b) => {
          const aDoc = (a.documentTitle || '').toLowerCase();
          const bDoc = (b.documentTitle || '').toLowerCase();
          return direction === "desc"
            ? bDoc.localeCompare(aDoc)
            : aDoc.localeCompare(bDoc);
        });
      case 'lastEditor':
        return [...items].sort((a, b) => a.updatedBy.localeCompare(b.updatedBy));
      case 'relevance':
      default:
        return items; // Original order
    }
  };

  const sortedAndFilteredItems = sortItems(filteredItems, qaSortColumn, qaSortDirection);

  const totalFiltersCount = Object.values(selectedTagFilters).reduce((sum, values) => sum + values.length, 0) +
                           selectedDocuments.length + selectedPriorSamples.length +
                           (selectedDateRange && selectedDateRange.type !== 'any' ? 1 : 0);
  
  // Treat URL as source of truth so we show Search Results when the URL has a query even if
  // state.query hasn't synced yet or was wrongly cleared. Fallback to window.location when
  // useSearchParams is stale (e.g. after navigate before Router has propagated).

  // Check if there are any parent questions with children
  const hasNestedQuestions = allItems.some(item => item.children && item.children.length > 0);

  const handleSearch = () => {
    const nextQuery = searchInput.trim();

    const hasFilters =
      Object.values(selectedTagFilters).some(values => values.length > 0) ||
      selectedDocuments.length > 0 ||
      selectedPriorSamples.length > 0 || 
      (selectedDateRange && selectedDateRange.type !== 'any');

    if (!nextQuery && !hasFilters) return;

    // 1) Sync state immediately
    setQuery(nextQuery);
    
    // 2) History should use the same canonical query value
    addToHistory(
      nextQuery,
      { strategies: selectedStrategy,
        types: selectedType,
        tags: selectedTags,
        statuses: selectedStatus,
      },
      currentSort
    );

    // 3) Build params in a way that preserves what we want to keep
    const params = new URLSearchParams(location.search);

    // Clear any stale search/filter params first
    params.delete('query');
    params.delete('strategy');
    params.delete('type');
    params.delete('tags');
    params.delete('status');
    params.delete('fileName');
    params.delete('count');

    // Now set the new search payload
    if (nextQuery) params.set('query', nextQuery);
    if (selectedStrategy.length) params.set('strategy', selectedStrategy.join(','));
    if (selectedType.length) params.set('type', selectedType.join(','));
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    if (selectedStatus.length) params.set('status', selectedStatus.join(','));
  
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
    if (effectiveQuery) params.set('query', effectiveQuery);
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
    const found = allItems.find(item => item.id === itemId);
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

  const handleOpenQAModal = (item: QuestionItem, mode: 'view' | 'edit' = 'view') => {
    setQaModalItem(item);
    setQaModalMode(mode);
    setQaModalOpenedInMode(mode);
    setQaModalOpen(true);
  };

  const handleEdit = (item: QuestionItem) => {
    handleOpenQAModal(item, 'edit');
  };

  const handleQAModalSave = (editData: { question: string; answer: string; tags: Tag[]; updatedAt: string; updatedBy: string }) => {
    if (!qaModalItem) return;
    const originalItem = findOriginalItem(qaModalItem.id);
    saveEdit(qaModalItem.id, editData, originalItem || undefined);
    // Modal will switch back to view mode internally
  };

  const handleQAModalModeChange = (mode: 'view' | 'edit') => {
    setQaModalMode(mode);
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

  // Bulk tag operations
  const handleBulkTagAdd = (tag: { type: string; value: string }) => {
    if (selectedItems.size === 0) return;
    
    const entries: Array<[string, QuestionItem]> = [];
    selectedItems.forEach(itemId => {
      const currentEdit = getEdit(itemId) || {};
      const originalItem = allItems.find(item => item.id === itemId);
      const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || originalItem?.tags || [];
      
      // Check if tag already exists
      const tagExists = currentTags.some(t => t.type === tag.type && t.value === tag.value);
      if (!tagExists) {
        const updatedItem = {
          ...(originalItem || {}),
          ...currentEdit,
          tags: [...currentTags, tag]
        };
        entries.push([itemId, updatedItem as QuestionItem]);
      }
    });
    
    if (entries.length > 0) {
      saveManyEdits(entries);
      toast({
        title: "Tags added",
        description: `Added tag "${tag.type}: ${tag.value}" to ${entries.length} item(s).`,
      });
      setSelectedItems(new Set());
    }
  };

  const handleBulkArchive = () => {
    if (selectedItems.size === 0) return;
    
    const edits: Array<[string, Partial<QuestionItem>]> = Array.from(selectedItems).map(itemId => {
      const currentEdit = getEdit(itemId) || {};
      return [itemId, { ...currentEdit, archived: true }];
    });
    
    saveManyEdits(edits);
    setSelectedItems(new Set());
    
    toast({
      title: "Items archived",
      description: `${edits.length} item(s) have been archived.`,
      duration: 3000,
    });
  };

  const handleBulkRestore = () => {
    if (selectedItems.size === 0) return;
    
    const edits: Array<[string, Partial<QuestionItem>]> = Array.from(selectedItems).map(itemId => {
      const currentEdit = getEdit(itemId) || {};
      return [itemId, { ...currentEdit, archived: false }];
    });
    
    saveManyEdits(edits);
    setSelectedItems(new Set());
    
    toast({
      title: "Items restored",
      description: `${edits.length} item(s) have been restored from archive.`,
      duration: 3000,
    });
  };

  const handleBulkTagRemove = (tag: { type: string; value: string }) => {
    if (selectedItems.size === 0) return;
    
    const entries: Array<[string, QuestionItem]> = [];
    selectedItems.forEach(itemId => {
      const currentEdit = getEdit(itemId) || {};
      const originalItem = allItems.find(item => item.id === itemId);
      const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || originalItem?.tags || [];
      
      const updatedTags = currentTags.filter(t => !(t.type === tag.type && t.value === tag.value));
      if (updatedTags.length !== currentTags.length) {
        const updatedItem = {
          ...(originalItem || {}),
          ...currentEdit,
          tags: updatedTags
        };
        entries.push([itemId, updatedItem as QuestionItem]);
      }
    });
    
    if (entries.length > 0) {
      saveManyEdits(entries);
      toast({
        title: "Tags removed",
        description: `Removed tag "${tag.type}: ${tag.value}" from ${entries.length} item(s).`,
      });
      setSelectedItems(new Set());
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

                {/* Tabs - above search */}
                <div id="documents-recent-tabs" className="px-6 pt-6 max-w-[100rem] mx-auto">
                  <div className="flex items-center gap-8 border-b border-foreground/10">
                    <button
                      onClick={() => handleTabChange("documents")}
                      className={`flex items-center gap-2 pb-4 text-lg font-medium transition-colors ${
                        activeTab === "documents"
                          ? "text-foreground border-b-2 border-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <FolderOpen className="h-5 w-5" />
                      Q&A Pairs
                    </button>
                    <button
                      onClick={() => handleTabChange("documents-list")}
                      className={`flex items-center gap-2 pb-4 text-lg font-medium transition-colors ${
                        activeTab === "documents-list"
                          ? "text-foreground border-b-2 border-foreground"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                      Documents
                    </button>
                  </div>
                </div>

                {/* Search Section - only when Q&A Pairs tab is selected */}
                {activeTab === "documents" && (
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
                    {hasActiveFilters && (
                      <div className="px-6 pb-2 flex items-center justify-between max-w-[100rem] mx-auto">
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
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDocuments(prev => prev.filter(d => d !== document))} />
                            </Badge>
                          ))}
                          {selectedDateRange && selectedDateRange.type !== 'any' && (
                            <Badge variant="secondary" className="gap-1">
                              Date range
                              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDateRange(null)} />
                            </Badge>
                          )}
                          {selectedPriorSamples.map(sampleId => {
                            const sample = fileHistory.find(f => f.id === sampleId);
                            return sample ? (
                              <Badge key={sampleId} variant="secondary" className="gap-1">
                                Sample: {sample.name}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedPriorSamples(prev => prev.filter(id => id !== sampleId))} />
                              </Badge>
                            ) : null;
                          })}
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content - tab content only (no inline search results) */}
              <div id="page-content" className="flex-1">
                <div className="h-full p-6 max-w-[100rem] mx-auto">
                  {/* Q&A Pairs Content */}
                  {activeTab === "documents" && (
                    <div ref={qaContentRef} className="space-y-6">
                      {/* Header with result count and view toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">Q&A Pairs</h2>
                          <p className="text-foreground/70 mt-1">
                            Showing {sortedAndFilteredItems.length} {sortedAndFilteredItems.length === 1 ? 'result' : 'results'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* View Toggle - Commented out, keeping only table view */}
                          {/* <div className="flex items-center gap-1 border border-foreground/10 rounded-lg p-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={qaViewMode === "table" ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setQaViewMode("table")}
                                  className="h-8 px-3"
                                >
                                  <TableIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Table view</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={qaViewMode === "list" ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setQaViewMode("list")}
                                  className="h-8 px-3"
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>List view</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={qaViewMode === "grid" ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setQaViewMode("grid")}
                                  className="h-8 px-3"
                                >
                                  <LayoutGrid className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Grid view</p>
                              </TooltipContent>
                            </Tooltip>
                          </div> */}
                          <Button
                            variant={state.showArchived ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newShowArchived = !state.showArchived;
                          setShowArchived(newShowArchived);
                          const newParams = new URLSearchParams(searchParams);
                          if (newShowArchived) {
                            newParams.set('showArchived', 'true');
                          } else {
                            newParams.delete('showArchived');
                          }
                          navigate(`/vault?${newParams.toString()}`, { replace: true });
                        }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {state.showArchived ? "Hide archived" : "Show archived"}
                          </Button>
                        </div>
                      </div>


                      {/* Q&A Pairs Content - Conditional Views */}
                      {sortedAndFilteredItems.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <p className="text-lg text-foreground/70 mb-4">
                            No Q&A pairs found.
                          </p>
                          {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                              Clear filters
                            </Button>
                          )}
                        </div>
                      ) : (
                        /* Table View - Only view enabled */
                        <div className="border border-foreground/10 rounded-lg overflow-hidden">
                          {(() => {
                            const tagTypes = getAllTagTypes();
                            // Calculate grid template columns: [checkbox] [Question] [Answer] [Document] [Last Updated] [Actions]
                            const gridTemplateColumns = `40px 1fr 1fr 200px 200px min-content`;
                            
                            return (
                              <div className="relative">
                                {/* Table Header */}
                                <div 
                                  className="grid sticky top-0 bg-sidebar-background border-b border-foreground/10 items-start"
                                  style={{ gridTemplateColumns }}
                                >
                                    <div className="flex items-start pr-4 pl-2 py-3">
                                      <Checkbox
                                        checked={selectedItems.size > 0 && selectedItems.size === sortedAndFilteredItems.length}
                                        onCheckedChange={handleSelectAll}
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleColumnSort('question')}
                                      className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground transition-colors text-left"
                                    >
                                      Question
                                      {qaSortColumn === 'question' && (
                                        qaSortDirection === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleColumnSort('answer')}
                                      className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground transition-colors text-left"
                                    >
                                      Answer
                                      {qaSortColumn === 'answer' && (
                                        qaSortDirection === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleColumnSort('document')}
                                      className="font-medium text-sm flex items-center px-4 py-3 gap-1 hover:text-foreground transition-colors text-left"
                                    >
                                      Document
                                      {qaSortColumn === 'document' && (
                                        qaSortDirection === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleColumnSort('lastUpdated')}
                                      className="font-medium text-sm flex items-center px-4 py-3 gap-1 hover:text-foreground transition-colors text-left whitespace-nowrap"
                                    >
                                      Last Updated
                                      {qaSortColumn === 'lastUpdated' && (
                                        qaSortDirection === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
                                      )}
                                    </button>
                                    <div className="font-medium px-4 py-3 text-sm">Actions</div>
                                  </div>

                                {/* Table Rows */}
                                <div className="divide-y divide-foreground/10">
                                  {sortedAndFilteredItems.map((item, index) => {
                                    const displayData = getDisplayData(item);
                                    const isSelected = selectedItems.has(item.id);
                                    const question = displayData.question || '';
                                    const answer = displayData.answer || '';
                                    const answerPreview = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
                                    const tagsByType = tagTypes.reduce((acc, tagType) => {
                                      acc[tagType.name] = (displayData.tags || []).filter((tag: { type: string; value: string }) => tag.type === tagType.name);
                                      return acc;
                                    }, {} as Record<string, Array<{ type: string; value: string }>>);
                                    const tags = displayData.tags || [];
                                    const isEvenRow = index % 2 === 0;
                                    
                                    return (
                                      <React.Fragment key={item.id}>
                                        {/* Main Row */}
                                        <div
                                          className={`group grid bg-background hover:bg-itemHoverBackground transition-all items-start grid-cols-[40px,1fr,1fr,200px,200px,min-content] ${
                                            isSelected ? 'bg-itemHoverBackground' : ''
                                          } ${
                                            displayData.archived 
                                              ? 'opacity-60 bg-muted/20 border-l-2 border-muted' 
                                              : ''
                                          } ${
                                            isEvenRow && !isSelected && !displayData.archived ? 'bg-sidebar-background' : ''
                                          }`}
                                        >
                                          <div className="flex items-start pr-4 pl-2 py-3">
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => handleItemSelect(item.id)}
                                            />
                                          </div>
                                          
                                          {/* Question Cell */}
                                          <div className="min-w-0 px-4 py-3">
                                            <div className="text-sm font-medium text-foreground">
                                              {question}
                                            </div>
                                          </div>
                                          
                                          {/* Answer Cell */}
                                          <div className="min-w-0 px-4 py-3">
                                            <div className="text-sm text-foreground/70 line-clamp-3">
                                              {answerPreview}
                                            </div>
                                            {answer.length > 200 && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenQAModal(item, 'view');
                                                }}
                                                className="text-xs text-sidebar-primary hover:underline mt-1"
                                              >
                                                Show more
                                              </button>
                                            )}
                                          </div>
                                          
                                          {/* Document Column */}
                                          <div className="text-sm text-foreground/70 break-all flex items-start px-4 py-3">
                                            {item.documentTitle || '-'}
                                          </div>
                                          
                                          {/* Last Updated Column */}
                                          <div className="text-sm text-foreground/70 flex items-start px-4 py-3">
                                            {displayData.updatedAt ? formatRelativeTime(displayData.updatedAt) : '-'}
                                          </div>
                                          
                                          {/* Actions Column - Hover Revealed */}
                                          <div className="grid items-start justify-center px-4 py-3 gap-1">
                                            <div className="grid items-start gap-1 justify-center">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleCopyAnswer(answer)}
                                                  >
                                                    <Copy className="h-4 w-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                  <p>Copy Answer</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleEdit(item)}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                  <p>Edit</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleArchive(item.id)}
                                                  >
                                                    {displayData.archived ? (
                                                      <ArchiveRestore className="h-4 w-4" />
                                                    ) : (
                                                      <Archive className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                  <p>{displayData.archived ? 'Restore' : 'Archive'}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleViewHistory(item.id, question, answer)}
                                                  >
                                                    <Clock className="h-4 w-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                  <p>View History</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                      setItemToDelete(item);
                                                      setDeleteConfirmOpen(true);
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                  <p>Delete</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Tags Row */}
                                        <div
                                          className={`grid bg-background hover:bg-itemHoverBackground transition-all items-start border-t border-foreground/5 ${
                                            isSelected ? 'bg-itemHoverBackground' : ''
                                          } ${
                                            displayData.archived 
                                              ? 'opacity-60 bg-muted/20' 
                                              : ''
                                          } ${
                                            isEvenRow && !isSelected && !displayData.archived ? 'bg-sidebar-background' : ''
                                          }`}
                                          style={{ gridTemplateColumns }}
                                        >
                                          <div></div> {/* Empty checkbox cell */}
                                          <div className="col-span-4 px-4 py-2 flex flex-wrap gap-2">
                                            {tags.length > 0 ? (
                                              Object.entries(tagsByType).map(([typeName, typeTags]) =>
                                                typeTags.map((tag: { type: string; value: string }) => (
                                                  <Badge
                                                    key={`${tag.type}-${tag.value}`}
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {typeName}: {tag.value}
                                                  </Badge>
                                                ))
                                              )
                                            ) : (
                                              <span className="text-xs text-foreground/50">No tags</span>
                                            )}
                                          </div>
                                          <div></div> {/* Empty actions cell */}
                                        </div>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                                
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* List View - Commented out, keeping only table view */}
                      {/* ) : qaViewMode === "list" ? (
                      <div className="space-y-4">
                          {sortedAndFilteredItems.map((item) => {
                          const hasEdits = !!getEdit(item.id);
                          const isExpanded = expandedAnswers.has(item.id);
                          const displayData = getDisplayData(item);
                            const isSelected = selectedItems.has(item.id);
                          
                          return (
                              <div key={item.id} className="relative">
                                <div className="absolute left-6 top-6 z-10 flex items-center">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleItemSelect(item.id)}
                                  />
                                </div>
                                <div className={`pl-12 ${isSelected ? 'ring-2 ring-sidebar-primary rounded-lg' : ''}`}>
                            <QuestionCard
                                    item={{
                                      ...item,
                                      ...displayData,
                                      isExpanded: nestedExpanded.has(item.id)
                                    }}
                                    query={searchInput}
                              hasEdits={hasEdits}
                              isExpanded={isExpanded}
                                    showBestAnswerTag={true}
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
                                </div>
                              </div>
                          );
                        })}
                          </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedAndFilteredItems.map((item) => {
                            const displayData = getDisplayData(item);
                            const isSelected = selectedItems.has(item.id);
                            const question = item.question || '';
                            const answer = displayData.answer || '';
                            const answerPreview = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
                            const tags = displayData.tags || [];
                            const tagTypes = getAllTagTypes();
                            const tagsByType = tagTypes.reduce((acc, tagType) => {
                              acc[tagType.name] = (displayData.tags || []).filter((tag: { type: string; value: string }) => tag.type === tagType.name);
                              return acc;
                            }, {} as Record<string, Array<{ type: string; value: string }>>);
                            
                            return (
                              <div
                                key={item.id}
                                className={`border border-foreground/10 rounded-lg p-4 hover:bg-sidebar-background transition-colors space-y-3 ${
                                  isSelected ? 'ring-2 ring-sidebar-primary' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleItemSelect(item.id)}
                                      className="h-4 w-4"
                                    />
                                    <div className="text-xs text-foreground/60">
                                      <span>{formatRelativeTime(item.updatedAt)}</span>
                      </div>
                    </div>
                                  <div className="flex items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleCopyAnswer(answer)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Copy Answer</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleEdit(item)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <DropdownMenu>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>More actions</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleCopyAnswer(answer)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy Answer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleArchive(item.id)}>
                                          {displayData.archived ? (
                                            <ArchiveRestore className="h-4 w-4 mr-2" />
                                          ) : (
                                            <Archive className="h-4 w-4 mr-2" />
                                          )}
                                          {displayData.archived ? 'Restore' : 'Archive'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewHistory(item.id, question, answer)}>
                                          <Clock className="h-4 w-4 mr-2" />
                                          View History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                onClick={() => {
                                            setItemToDelete(item);
                                            setDeleteConfirmOpen(true);
                                          }}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                        </div>
                                    </div>
                                
                                <div className="text-sm font-medium text-foreground">
                                  {question}
                                      </div>
                                
                                <div className="space-y-1">
                                  <div className="text-xs text-foreground/70 line-clamp-3">
                                    {answerPreview}
                                      </div>
                                  {answer.length > 200 && (
                                  <button
                                      onClick={() => handleOpenQAModal(item, 'view')}
                                      className="text-xs text-sidebar-primary hover:underline"
                                    >
                                      Show more
                                  </button>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-1">
                                  {tagTypes.map((tagType) => {
                                    const tagsOfType = tagsByType[tagType.name] || [];
                                    return tagsOfType.slice(0, 3).map((tag: { type: string; value: string }) => (
                                      <Badge
                                        key={`${tag.type}-${tag.value}`}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {tag.value}
                                      </Badge>
                                    ));
                                  })}
                                  {(displayData.tags || []).length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(displayData.tags || []).length - 3}
                                    </Badge>
                                      )}
                                    </div>
                                
                                {item.documentTitle && (
                                  <div className="flex items-center gap-2 text-xs text-foreground/60 pt-2 border-t border-foreground/10">
                                    <FileText className="h-4 w-4 flex-shrink-0 text-foreground/60" />
                                    <span className="truncate">{item.documentTitle}</span>
                                    </div>
                                )}
                                  </div>
                            );
                          })}
                                </div>
                      ) */}
                                </div>
                  )}

                  {/* Documents List Content */}
                  {activeTab === "documents-list" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">Documents</h2>
                          <p className="text-foreground/70">Source materials and uploaded documents</p>
                        </div>  
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-full border border-foreground/20 p-0.5 bg-sidebar-background/50">
                          <Button
                            variant={documentViewMode === "type" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-full h-8 px-4"
                            onClick={() => setDocumentViewMode("type")}
                          >
                            By Type
                          </Button>
                          <Button
                            variant={documentViewMode === "quarter" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-full h-8 px-4"
                            onClick={() => setDocumentViewMode("quarter")}
                          >
                            By Quarter
                          </Button>
                        </div>
                        {documentViewMode === "quarter" && (
                          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                            <SelectTrigger className="w-[200px] h-8">
                              <SelectValue placeholder="Filter by quarter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="ytd">YTD (Current Year)</SelectItem>
                              <SelectItem value="last-year">Last Year</SelectItem>
                              {getQuarterOptions().map((quarter) => (
                                <SelectItem key={quarter} value={quarter}>
                                  {formatQuarter(quarter)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        </div>

                      {(() => {
                        // Display type for "By Type" view: Data files, Insights, Questionnaires, Samples
                        type DisplayType = "Data files" | "Insights" | "Questionnaires" | "Samples";
                        const getDisplayType = (docType: string): DisplayType => {
                          if (docType === "Data Files") return "Data files";
                          if (docType === "Policy Docs") return "Insights";
                          if (docType === "Commentary Docs") return "Samples";
                          return "Questionnaires";
                        };

                        type DocType = {
                          id: string;
                          name: string;
                          type: string;
                          displayType: DisplayType;
                          uploadedAt: string;
                          uploadedBy: string;
                          documentId?: string;
                          quarter?: string;
                        };

                        // Get unique documents from all items
                        const documentMap = new Map<string, DocType>();

                        allItems.forEach(item => {
                          if (item.documentTitle) {
                            const displayData = getDisplayData(item);
                            const docKey = item.documentTitle;
                            if (!documentMap.has(docKey)) {
                              let docType = "Questionnaires";
                              if (item.type === "Policies" || item.type === "Policy") {
                                docType = "Policy Docs";
                              } else if (item.type === "Commentary") {
                                docType = "Commentary Docs";
                              } else if (item.type === "Data Files" || item.type === "Quantitative") {
                                docType = "Data Files";
                              }

                              documentMap.set(docKey, {
                                id: item.documentId || item.id,
                                name: item.documentTitle,
                                type: docType,
                                displayType: getDisplayType(docType),
                                uploadedAt: displayData.updatedAt,
                                uploadedBy: displayData.updatedBy,
                                documentId: item.documentId,
                                quarter: displayData.quarter
                              });
                            }
                          }
                        });

                        // Filter by quarter
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const filteredDocs = Array.from(documentMap.values()).filter(doc => {
                          if (quarterFilter === "all") return true;
                          if (quarterFilter === "ytd") {
                            if (!doc.quarter) return false;
                            const parsed = getQuarterFromString(doc.quarter);
                            return parsed && parsed.year === currentYear;
                          }
                          if (quarterFilter === "last-year") {
                            if (!doc.quarter) return false;
                            const parsed = getQuarterFromString(doc.quarter);
                            return parsed && parsed.year === currentYear - 1;
                          }
                          return doc.quarter === quarterFilter;
                        });

                        const DISPLAY_TYPE_ORDER: DisplayType[] = ["Data files", "Insights", "Questionnaires", "Samples"];

                        // Group by quarter for "By Quarter" view
                        const docsByQuarter = new Map<string, DocType[]>();
                        filteredDocs.forEach(doc => {
                          const quarter = doc.quarter || "Unassigned";
                          if (!docsByQuarter.has(quarter)) {
                            docsByQuarter.set(quarter, []);
                          }
                          docsByQuarter.get(quarter)!.push(doc);
                        });

                        const sortedQuarters: Array<[string, DocType[]]> = Array.from(docsByQuarter.entries()).sort(([a], [b]) => {
                          if (a === "Unassigned") return 1;
                          if (b === "Unassigned") return -1;
                          return b.localeCompare(a);
                        }) as Array<[string, DocType[]]>;

                        // Group by display type for "By Type" view (all docs, no quarter filter)
                        const allDocs = Array.from(documentMap.values());
                        const docsByDisplayType = new Map<DisplayType, DocType[]>();
                        DISPLAY_TYPE_ORDER.forEach(t => docsByDisplayType.set(t, []));
                        allDocs.forEach(doc => {
                          docsByDisplayType.get(doc.displayType)!.push(doc);
                        });

                        const gridTemplateColumns = "300px 150px 120px 150px 200px min-content";
                        
                        const TableHeaderRow = () => (
                          <div 
                            className="grid sticky top-0 bg-background border-b border-foreground/10 items-start z-10"
                            style={{ gridTemplateColumns }}
                          >
                            <div className="font-medium text-sm px-4 py-3">Document name</div>
                            <div className="font-medium text-sm px-4 py-3">Type</div>
                            <div className="font-medium text-sm px-4 py-3">Quarter</div>
                            <div className="font-medium text-sm px-4 py-3">Uploaded</div>
                            <div className="font-medium text-sm px-4 py-3">Uploaded by</div>
                            <div className="font-medium text-sm px-4 py-3">Actions</div>
                          </div>
                        );

                        const renderDocTableRow = (doc: DocType, index: number) => {
                          const isEvenRow = index % 2 === 0;
                          return (
                            <div
                              key={doc.id}
                              className={`grid bg-background hover:bg-itemHoverBackground transition-all items-start ${
                                isEvenRow ? 'bg-sidebar-background' : ''
                              }`}
                              style={{ gridTemplateColumns }}
                            >
                              <div className="min-w-0 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-foreground/70 flex-shrink-0" />
                                  <span className="text-sm font-medium text-foreground truncate">{doc.name}</span>
                                </div>
                              </div>
                              <div className="px-4 py-3">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {doc.displayType}
                                </Badge>
                              </div>
                              <div className="px-4 py-3">
                                <Popover open={quarterPopoverDocName === doc.name} onOpenChange={(open) => setQuarterPopoverDocName(open ? doc.name : null)}>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-md border border-transparent bg-foreground/5 px-2 py-0.5 text-xs font-normal text-secondary-foreground hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group"
                                    >
                                      <span>{doc.quarter ? formatQuarter(doc.quarter) : "Unassigned"}</span>
                                      <Edit className="h-3 w-3 -ml-3 opacity-0 -translate-x-0.5 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-ml-0" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-1" align="start">
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        type="button"
                                        className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent ${(!doc.quarter ? "bg-accent font-medium" : "")}`}
                                        onClick={() => {
                                          applyQuarterToDocument(doc.name, undefined);
                                          setQuarterPopoverDocName(null);
                                        }}
                                      >
                                        Unassigned
                                        {!doc.quarter && <Check className="h-4 w-4" />}
                                      </button>
                                      {getQuarterOptions().map((quarter) => (
                                        <button
                                          key={quarter}
                                          type="button"
                                          className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent ${(doc.quarter === quarter ? "bg-accent font-medium" : "")}`}
                                          onClick={() => {
                                            applyQuarterToDocument(doc.name, quarter);
                                            setQuarterPopoverDocName(null);
                                          }}
                                        >
                                          {formatQuarter(quarter)}
                                          {doc.quarter === quarter && <Check className="h-4 w-4" />}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="text-sm text-foreground/70 px-4 py-3">
                                {formatRelativeTime(doc.uploadedAt)}
                              </div>
                              <div className="text-sm text-foreground/70 px-4 py-3">
                                {doc.uploadedBy}
                              </div>
                              <div className="grid items-start justify-center px-4 py-3 gap-1">
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toast({ title: "View Document", description: "Document viewing will be implemented." })}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>View Document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toast({ title: "Download Document", description: "Document download will be implemented." })}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Download</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {doc.type === "Data Files" && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => navigate(`/vault?fileName=${encodeURIComponent(doc.name)}`)}
                                        >
                                          <Database className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>View Data</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive"
                                        onClick={() => toast({ title: "Delete Document", description: "Document deletion will be implemented.", variant: "destructive" })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Delete</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-6">
                            {documentViewMode === "quarter" ? (
                              (sortedQuarters as Array<[string, DocType[]]>).map(([quarter, quarterDocs]) => (
                                <Collapsible
                                  key={quarter}
                                  open={!collapsedDocSections.has(quarter)}
                                  onOpenChange={(open) => setCollapsedDocSections(prev => { const next = new Set(prev); if (open) next.delete(quarter); else next.add(quarter); return next; })}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start rounded-full h-10 rounded-none px-4 border-b border-foreground/10 active:scale-[0.99]">
                                      {collapsedDocSections.has(quarter) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      <span className="font-lg">{quarter === "Unassigned" ? "Unassigned" : formatQuarter(quarter)}</span>
                                      <span className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-normal">{quarterDocs.length}</Badge>
                                      </span>
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="divide-y divide-foreground/10">
                                      <TableHeaderRow />
                                      {quarterDocs.map((doc, index) => renderDocTableRow(doc, index))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))
                            ) : (
                              DISPLAY_TYPE_ORDER.map(displayType => {
                                const typeDocs = docsByDisplayType.get(displayType)!;
                                if (typeDocs.length === 0) return null;
                                return (
                                  <Collapsible
                                    key={displayType}
                                    open={!collapsedDocSections.has(displayType)}
                                    onOpenChange={(open) => setCollapsedDocSections(prev => { const next = new Set(prev); if (open) next.delete(displayType); else next.add(displayType); return next; })}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" className="w-full justify-start rounded-none h-10 px-4 border-b border-foreground/10 active:scale-[0.99]">
                                        {collapsedDocSections.has(displayType) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        <span className="font-lg">{displayType}</span>
                                        <span className="flex items-center gap-2">
                                          <Badge variant="secondary" className="font-normal">{typeDocs.length}</Badge>
                                        </span>
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="divide-y divide-foreground/10">
                                        <TableHeaderRow />
                                        {typeDocs.map((doc, index) => renderDocTableRow(doc, index))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })
                            )}
                            {(documentViewMode === "quarter" ? filteredDocs.length === 0 : allDocs.length === 0) && (
                              <div className="text-center py-12">
                                <p className="text-lg text-foreground/70 mb-4">No documents found.</p>
                                <Button variant="outline" onClick={() => navigate('/vault/add-content')}>Upload Documents</Button>
                              </div>
                            )}
                          </div>
                        );
                      })() as React.ReactElement}
                    </div>
                  )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Modals */}
      <FirmUpdatesModal
        open={showFirmUpdatesModal}
        onClose={() => setShowFirmUpdatesModal(false)}
      />
      
      <FindDuplicatesModal
        open={showFindDuplicatesModal}
        onClose={() => setShowFindDuplicatesModal(false)}
      />

      {/* Quarter assignment dialog for documents */}
      <Dialog open={!!quarterAssignDocument} onOpenChange={(open) => !open && setQuarterAssignDocument(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign quarter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {quarterAssignDocument && (
              <p className="text-sm text-foreground/70">
                Document: <span className="font-medium text-foreground">{quarterAssignDocument.name}</span>
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={quarterAssignSelected} onValueChange={setQuarterAssignSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {getQuarterOptions().map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {formatQuarter(quarter)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuarterAssignDocument(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssignQuarter}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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

      {/* Floating Bulk Actions Bar */}
      {selectedItems.size > 0 && qaContentBounds && (
        <div 
          className="fixed bottom-4 z-50"
          style={{
            left: `${qaContentBounds.left + 40}px`,
            width: `${qaContentBounds.width - 80}px`,
          }}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-t from-sidebar-background/90 via-sidebar-background/95 to-sidebar-background/80 backdrop-blur-sm border border-sidebar-primary/50 rounded-xl shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Add Tag
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search tag types..." />
                      <CommandList>
                        <CommandEmpty>No tag types found.</CommandEmpty>
                        {getAllTagTypes().map((tagType) => (
                          <CommandGroup key={tagType.name} heading={tagType.name}>
                            {getTagTypeValues(tagType.name).map((value) => (
                              <CommandItem
                                key={value}
                                onSelect={() => {
                                  handleBulkTagAdd({ type: tagType.name, value });
                                }}
                              >
                                {value}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Remove Tag
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        {(() => {
                          // Get all unique tags from selected items
                          const selectedTags = new Map<string, Set<string>>();
                          selectedItems.forEach(itemId => {
                            const item = allItems.find(i => i.id === itemId);
                            if (item) {
                              const displayData = getDisplayData(item);
                              (displayData.tags || []).forEach((tag: { type: string; value: string }) => {
                                if (!selectedTags.has(tag.type)) {
                                  selectedTags.set(tag.type, new Set());
                                }
                                selectedTags.get(tag.type)!.add(tag.value);
                              });
                            }
                          });
                          
                          return Array.from(selectedTags.entries()).map(([tagType, values]) => (
                            <CommandGroup key={tagType} heading={tagType}>
                              {Array.from(values).map((value) => (
                                <CommandItem
                                  key={value}
                                  onSelect={() => {
                                    handleBulkTagRemove({ type: tagType, value });
                                  }}
                                >
                                  {value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ));
                        })()}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!state.showArchived ? (
                  <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear selection
                </Button>
              </div>
            </div>
          </div>
      )}

      {/* Change History Modal */}
      <ChangeHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        itemId={historyModalItemId || ''}
        currentQuestion={historyModalQuestion}
        currentAnswer={historyModalAnswer}
      />

      {/* Unified QA Detail Modal */}
      {qaModalItem && (
        <QADetailModal
          open={qaModalOpen}
          onClose={() => {
            setQaModalOpen(false);
            setQaModalItem(null);
          }}
          item={qaModalItem}
          mode={qaModalMode}
          openedInMode={qaModalOpenedInMode}
          onModeChange={handleQAModalModeChange}
          onSave={handleQAModalSave}
          existingEdit={getEdit(qaModalItem.id)}
        />
      )}
    </div>
  );
}