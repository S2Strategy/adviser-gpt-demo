import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { QuestionCard } from "./QuestionCard";
import { 
  Search,
  Archive,
  ChevronRight, 
  Home, 
  ChevronDown, 
  FileText, 
  User, 
  MoreHorizontal,
  Mail,
  Edit,
  Copy,
  X,
  Star,
  Calendar,
  UsersRound,
  CornerDownRight,
  Check,
  ArrowUpDown,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VaultEditSheet } from "./VaultEditSheet";
import { SaveSearchPrompt } from "./SaveSearchPrompt";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, QuestionItem, TAGS_INFO } from "@/types/vault";
import { ContentItem } from "@/types/vault";
import { smartSearch, getSemanticVariations, getSearchSuggestions } from "@/utils/smartSearch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";

export function VaultSearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { state, setQuery, setFilters, setSort } = useVaultState();
  const { edits, saveEdit, getEdit } = useVaultEdits();
  const { toast } = useToast();
  
  // Extract URL parameters
  const urlQuery = searchParams.get('query') || '';
  const fileName = searchParams.get('fileName');
  const fileCount = parseInt(searchParams.get('count') || '0');

  // Determine if we're in file view mode
  const isFileMode = location.pathname === '/vault/file' && fileName;

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
  
  // Initialize state with URL parameters
  const [query, setQueryState] = useState(urlQuery);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [editingItem, setEditingItem] = useState<QuestionItem | null>(null);
  
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [addingTagToItem, setAddingTagToItem] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState("");
  const [addingStrategyToItem, setAddingStrategyToItem] = useState<string | null>(null);
  const [newStrategyValue, setNewStrategyValue] = useState("");
  
  // Get sort state from URL or default to 'relevance'
  const currentSort = searchParams.get('sort') || state.sort || 'relevance';

  // Helper function to normalize strategies (convert single string to array)
  const normalizeStrategies = (strategy: string | string[]): string[] => {
    return Array.isArray(strategy) ? strategy : [strategy];
  };

  // Helper function to merge original item with saved edits
  const getDisplayData = (item: QuestionItem) => {
    const savedEdit = getEdit(item.id);
    if (!savedEdit) return item;

    return {
      ...item,
      question: savedEdit.question || item.question,
      answer: savedEdit.answer || item.answer,
      strategy: savedEdit.strategy || item.strategy,
      tags: savedEdit.tags || item.tags,
    };
  };

  // Smart highlighting function that works with semantic search
  const highlightSearchTerms = (text: string, query: string) => {
    if (!query?.trim()) return text;
    
    // Split query into meaningful terms (2+ chars, exclude common words)
    const terms = query.split(/\s+/)
      .filter(term => term.length >= 2)
      .filter(term => !['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'a', 'an'].includes(term.toLowerCase()));
    
    if (terms.length === 0) return text;
    
    // Get all semantic variations for highlighting
    const allTerms = new Set<string>();
    terms.forEach(term => {
      allTerms.add(term);
      const variations = getSemanticVariations(term);
      variations.forEach(variation => allTerms.add(variation));
    });
    
    // Create regex for phrase matching and individual terms
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${Array.from(allTerms).map(term => escapeRegex(term)).join('|')})`, 'gi');
    
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  };

  // Use smart search for query matching, then apply filters
  const smartSearchResults = query ? smartSearch(allItems, query) : allItems;
  
  // Apply additional filters to smart search results
  const filteredItems = smartSearchResults.filter(item => {
    const displayData = getDisplayData(item);
    
    const itemStrategies = normalizeStrategies(displayData.strategy);
    const matchesStrategy = selectedStrategies.length === 0 || 
      selectedStrategies.some(selectedStrategy => itemStrategies.includes(selectedStrategy));
    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.includes(displayData.type);
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => displayData.tags.includes(tag));
    const matchesStatus = selectedStatuses.length === 0 || 
      selectedStatuses.includes(displayData.type); // Using type as status for mock data
    
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

  const hasActiveFilters = selectedStrategies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0;

  const clearFilters = () => {
    setSelectedStrategies([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedTags([]);
    
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    
    // Preserve file context if in file mode
    if (isFileMode && fileName) {
      params.set('fileName', fileName);
      params.set('count', fileCount.toString());
      navigate(`/vault/file?${params.toString()}`);
    } else {
      navigate(`/vault/search?${params.toString()}`);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    updateFiltersInUrl(query, selectedStrategies, selectedTypes, newTags, selectedStatuses);
  };

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper function to update filters in URL
  const updateFiltersInUrl = (
    queryValue: string,
    strategies: string[],
    types: string[],
    tags: string[],
    statuses: string[]
  ) => {
    const params = new URLSearchParams();
    
    // Only trim leading/trailing spaces, preserve internal spaces
    if (queryValue && queryValue.trim()) params.set('query', queryValue.trim());
    if (strategies.length > 0) params.set('strategy', strategies.join(','));
    if (types.length > 0) params.set('type', types.join(','));
    if (tags.length > 0) params.set('tags', tags.join(','));
    if (statuses.length > 0) params.set('status', statuses.join(','));
    
    // Preserve file context if in file mode
    if (isFileMode && fileName) {
      params.set('fileName', fileName);
      params.set('count', fileCount.toString());
      navigate(`/vault/file?${params.toString()}`);
    } else {
      navigate(`/vault/search?${params.toString()}`);
    }
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
    if (query) params.set('query', query);
    if (isFileMode && fileName) {
      params.set('fileName', fileName);
      params.set('count', fileCount.toString());
      navigate(`/vault/file?${params.toString()}`);
    } else {
      navigate(`/vault/search?${params.toString()}`);
    }
  };

  const handleSearch = () => {
    setQuery(searchInput);
    setQueryState(searchInput);
    updateFiltersInUrl(searchInput, selectedStrategies, selectedTypes, selectedTags, selectedStatuses);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    // All other keys proceed with default behavior for normal typing
  };

  // Removed handleSearchDebounced - search now only triggers on Enter

  // Initialize state from URL parameters on mount and when they change
  useEffect(() => {
    // Reset all state based on URL parameters
    setQuery(urlQuery);
    setQueryState(urlQuery);
    setSearchInput(urlQuery);
    
    // Reset filters based on URL parameters
    setSelectedStrategies(
      searchParams.get('strategy')?.split(',').filter(Boolean) || []
    );
    setSelectedTypes(
      searchParams.get('type')?.split(',').filter(Boolean) || []
    );
    setSelectedStatuses(
      searchParams.get('status')?.split(',').filter(Boolean) || []
    );
    setSelectedTags(
      searchParams.get('tags')?.split(',').filter(Boolean) || []
    );
  }, [urlQuery, searchParams]);

  /**
 * Format an ISO date string into a human-friendly relative time.
 * Rules:
 * - < 7 days: "today", "1 day ago", "N days ago"
 * - 7–31 days: "1–4 weeks ago" (rounded)
 * - 31–364 days: "1–12 months ago" (calendar months)
 * - 365–379 days: "1y ago"
 * - ≥ 380 days: "Ny Nmo ago" (calendar years + remaining months)
 */
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
}


  const formatFullDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric', 
      year: 'numeric'
    });
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

  const handleNewTagSave = (itemId: string) => {
    if (newTagValue.trim()) {
      handleTagAdd(itemId, newTagValue.trim());
      setNewTagValue("");
      setAddingTagToItem(null);
    }
  };

  const handleNewTagCancel = () => {
    setNewTagValue("");
    setAddingTagToItem(null);
  };

  const handleStrategyAdd = (id: string, strategy: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentStrategies = normalizeStrategies(currentEdit.strategy || originalItem?.strategy || []);
    
    if (!currentStrategies.includes(strategy)) {
      saveEdit(id, { ...currentEdit, strategy: [...currentStrategies, strategy] });
    }
  };


  const handleQuickEdit = (id: string, field: string, value: string) => {
    // Use the useVaultEdits hook instead of direct localStorage manipulation
    const currentEdit = getEdit(id) || {};
    saveEdit(id, { ...currentEdit, [field]: value });
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
        fileName: (item as any).documentTitle || 'Unknown Document', // Use document title as filename for export
        lastEdited: formatFullDate(item.updatedAt),
        lastEditor: item.updatedBy,
        tags: getDisplayData(item).tags,
        strategy: getDisplayData(item).strategy,
        type: item.type
      }));

      const isFileView = fileName && !query;
      const contextTitle = isFileView 
        ? `${filteredItems.length} Questions in ${fileName}`
        : `Search Results for "${query}"`;
      
      const contextName = isFileView ? fileName || 'file' : `Search_${query}`;
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

  return (
    <div className="h-screen flex ml-64">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header with Breadcrumbs */}
      <div className="border-b bg-background">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link 
            to="/vault" 
            className="text-muted-foreground hover:text-foreground"
          >
            Vault
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {fileName ? (
            <span className="text-foreground font-medium">
              {fileName}
            </span>
          ) : (
            <span className="text-foreground font-medium">
              {query || "All results"}
            </span>
          )}
        </div>

        {/* Main Title and Search */}
        <div className="mb-2 bg-gray-50 flex items-center gap-3 p-6">
          <div className="flex flex-1 items-center gap-2 text-xl">
            <div className="inline-flex flex-0 items-center gap-1">
              {fileName ? (
              <span className="text-foreground">
                {query ? `${filteredItems.length}` : `${fileCount}`} {query && filteredItems.length === 1 ? "Question" : "Questions"}
              </span>
              ) : (
                <span className="text-foreground">
                  {filteredItems.length} {filteredItems.length === 1 ? "Result" : "Results"} {query ? `for` : ""}
                </span>
              )}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="filter results"
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Filters and Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MultiSelectFilter
                title="Strategy"
                size="xl"
                options={STRATEGIES}
                selectedValues={selectedStrategies}
                onSelectionChange={(values) => {
                  setSelectedStrategies(values);
                  updateFiltersInUrl(query, values, selectedTypes, selectedTags, selectedStatuses);
                }}
              />

              <MultiSelectFilter
                title="Types"
                size="xl"
                options={CONTENT_TYPES}
                selectedValues={selectedTypes}
                onSelectionChange={(values) => {
                  setSelectedTypes(values);
                  updateFiltersInUrl(query, selectedStrategies, values, selectedTags, selectedStatuses);
                }}
              />

              <MultiSelectFilter
                title="Tags"
                size="xl"
                options={TAGS_INFO.map(tag => tag.name)}
                selectedValues={selectedTags}
                onSelectionChange={(values) => {
                  setSelectedTags(values);
                  updateFiltersInUrl(query, selectedStrategies, selectedTypes, values, selectedStatuses);
                }}
                placeholder="Tags"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="xl">
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
            </div>

            
          </div>
        </div>
        
        <div className="px-6 mb-2 flex items-center justify-between">
          
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 px-6 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedStrategies.map(strategy => (
                <Badge key={strategy} variant="secondary" className="gap-1">
                  Strategy: {strategy}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const newStrategies = selectedStrategies.filter(s => s !== strategy);
                      setSelectedStrategies(newStrategies);
                      updateFiltersInUrl(query, newStrategies, selectedTypes, selectedTags, selectedStatuses);
                    }}
                  />
                </Badge>
              ))}
              {selectedTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  Type: {type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const newTypes = selectedTypes.filter(t => t !== type);
                      setSelectedTypes(newTypes);
                      updateFiltersInUrl(query, selectedStrategies, newTypes, selectedTags, selectedStatuses);
                    }}
                  />
                </Badge>
              ))}
              {selectedStatuses.map(status => (
                <Badge key={status} variant="secondary" className="gap-1">
                  Status: {status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const newStatuses = selectedStatuses.filter(s => s !== status);
                      setSelectedStatuses(newStatuses);
                      updateFiltersInUrl(query, selectedStrategies, selectedTypes, selectedTags, newStatuses);
                    }}
                  />
                </Badge>
              ))}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  Tag: {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              <Button variant="link" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

          <div className="flex flex-1 items-center justify-end gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Export View
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

            {/* Save Search Prompt */}
            <div className="flex justify-end">
              <div>
                <SaveSearchPrompt
                  query={query}
                  filters={{
                    strategies: selectedStrategies,
                    types: selectedTypes,
                    tags: selectedTags,
                    statuses: selectedStatuses,
                  }}
                  sort={currentSort}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-6 space-y-6">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No results match your filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          sortedAndFilteredItems.map((item, index) => {
            const hasEdits = !!getEdit(item.id);
            const isExpanded = expandedAnswers.has(item.id);
            
            return (
              <QuestionCard
                key={item.id}
                item={item}
                query={query}
                fileName={fileName}
                hasEdits={hasEdits}
                isExpanded={isExpanded}
                showBestAnswerTag={true}
                onToggleExpansion={toggleAnswerExpansion}
                onEdit={handleEdit}
                onCopyAnswer={handleCopyAnswer}
                onStrategyRemove={handleStrategyRemove}
                onStrategyAdd={handleStrategyAdd}
                onTagRemove={handleTagRemove}
                onTagAdd={handleTagAdd}
                highlightSearchTerms={highlightSearchTerms}
                formatRelativeTime={formatRelativeTime}
                formatFullDate={formatFullDate}
              />
            );
          })
        )}
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
      </div>
    </div>
  );
}