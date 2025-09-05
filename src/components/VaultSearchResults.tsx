import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { MultiSelectFilter } from "./MultiSelectFilter";
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
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, QuestionItem } from "@/types/vault";
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

  // Flatten the nested data structure for processing
  const flattenItems = (): QuestionItem[] => {
    return MOCK_CONTENT_ITEMS.flatMap(doc => 
      doc.items.map(item => ({
        ...item,
        documentTitle: doc.title,
        documentId: doc.id
      }))
    );
  };

  const allItems = flattenItems();
  
  // Determine if we're in file view mode
  const isFileMode = location.pathname === '/vault/file' && fileName;
  
  const [query, setQueryState] = useState(urlQuery);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [editingItem, setEditingItem] = useState<QuestionItem | null>(null);
  
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(
    searchParams.get('strategy')?.split(',').filter(Boolean) || []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('type')?.split(',').filter(Boolean) || []
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
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

  // Update width when query changes in edit mode
  useEffect(() => {
    setQuery(urlQuery);
    setQueryState(urlQuery);
    setSearchInput(urlQuery);
  }, [urlQuery]);

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
        <div className="p-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mb-6">
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
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 text-xl">
              {fileName ? (
              <span className="text-muted-foreground">
                 {query ? `${filteredItems.length}` : `${fileCount}`} Questions 
              </span>
              ) : (
                <span className="text-muted-foreground">
                  {filteredItems.length} Results {query ? `for` : ""}
                </span>
              )}
          <div className="relative">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-transparent outline-none border-t-0 border-x-0 border-b-2 border-dashed border-muted-foreground text-foreground font-medium px-1 min-w-[250px]"
              placeholder="filter results"
              style={{ width: `${Math.max(searchInput.length * 12 + 20, 250)}px` }}
            />
          </div>
            </div>
          </div>

          {/* Filters and Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MultiSelectFilter
                title="Strategy"
                options={STRATEGIES}
                selectedValues={selectedStrategies}
                onSelectionChange={(values) => {
                  setSelectedStrategies(values);
                  updateFiltersInUrl(query, values, selectedTypes, selectedTags, selectedStatuses);
                }}
              />

              <MultiSelectFilter
                title="Types"
                options={CONTENT_TYPES}
                selectedValues={selectedTypes}
                onSelectionChange={(values) => {
                  setSelectedTypes(values);
                  updateFiltersInUrl(query, selectedStrategies, values, selectedTags, selectedStatuses);
                }}
              />

              <MultiSelectFilter
                title="Tags"
                options={["AI", "ESG", "RFP", "Policy", "Risk Management", "Investment Strategy", "Portfolio Management", "Asset Management", "Financial Services", "Financial Analysis"]}
                selectedValues={selectedTags}
                onSelectionChange={(values) => {
                  setSelectedTags(values);
                  updateFiltersInUrl(query, selectedStrategies, selectedTypes, values, selectedStatuses);
                }}
              />

              {/* <MultiSelectFilter
                title="Status"
                options={STATUS_OPTIONS}
                selectedValues={selectedStatuses}
                onSelectionChange={(values) => {
                  setSelectedStatuses(values);
                  updateFiltersInUrl(query, selectedStrategies, selectedTypes, selectedTags, values);
                }}
              /> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
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
            const displayData = getDisplayData(item);
            const hasEdits = !!getEdit(item.id);
            const isFirstResult = index === 0;
            const isExpanded = expandedAnswers.has(item.id);
            const answer = displayData.answer || '';
            const shouldTruncate = answer.length > 300;
            const displayAnswer = isExpanded ? answer : answer.substring(0, 300);
            
            return (
          <div key={item.id} className="border rounded-lg bg-card vault-result-card">
            {/* Header with file info and badge */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7] px-6 py-4">
              <div className="flex items-center min-w-0 gap-3 flex-1">
                {!fileName && (
                  <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#71717A' }} />
                )}
                {!fileName && (
                <div 
                  className="font-bold break-words min-w-0 text-sm"
                  style={{ 
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    fontSize: '14px', 
                    lineHeight: '1.4' 
                  }}
                >
                  {(item as any).documentTitle || 'Unknown Document'}
                </div>
                )}
                <div className="flex items-center gap-4 text-sm" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="h-4 w-4" style={{ color: '#71717A' }} />
                    <span style={{ color: '#71717A' }}>Last edited</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                      <span className="inline-grid border border-t-0 border-x-0 border-b-1 border-dashed border-gray-300 cursor-help" style={{ color: '#27272A' }}>{formatRelativeTime(item.updatedAt)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">{formatFullDate(item.updatedAt)}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <span style={{ color: '#71717A' }}>by</span>
                    <span style={{ color: '#27272A' }}>{item.updatedBy}</span>
                  </div>
                  <div className="flex items-center gap-1 whitespace-nowrap">

                    
                  </div>
                  {hasEdits && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Edited
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {displayData.isBestAnswer && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#CCECB6', color: '#09090B' }}>
                    <Star className="h-3 w-3" />
                    <span className="text-xs font-semibold">Best Answer</span>
                  </div>
                )}
              </div>
            </div>

                 {/* Answer Section */}
                 {displayData.answer && (
                   <div className="space-y-2 px-6 py-4">
                     <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Answer</h4>
                      <div className="bg-muted/50 rounded-md p-4">
                        <p 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerms(displayAnswer, query) + (shouldTruncate && !isExpanded ? '...' : '')
                          }}
                        />
                       {shouldTruncate && (
                         <Button
                           variant="link"
                           size="sm"
                           className="mt-2 p-0 h-auto"
                           onClick={() => toggleAnswerExpansion(item.id)}
                         >
                           {isExpanded ? 'Show less' : 'Show more'}
                         </Button>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Question Section */}
                 {displayData.question && (
                   <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
                     <div className="flex items-start gap-2">
                       <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#71717A' }} />
                       <div className="space-y-2">
                         <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Question</h4>
                          <p 
                            style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '700', letterSpacing: '-0.4px' }}
                            dangerouslySetInnerHTML={{ __html: highlightSearchTerms(displayData.question, query) }}
                          />
                         
                         {/* Tags in Question Section */}
                         <div className="flex flex-wrap items-center gap-2 mt-3">
                           {normalizeStrategies(displayData.strategy).map((strategy, index) => (
                             <Badge 
                               key={`${strategy}-${index}`} 
                               variant="outline" 
                               className="vault-tag flex items-center gap-1 cursor-pointer hover:bg-blue-50"
                               onClick={() => {
                                 // Add click handler for editing strategies
                                 console.log('Edit strategy:', strategy);
                               }}
                             >
                               <Lightbulb className="h-3 w-3" />
                               {strategy}
                               <X 
                                 className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleStrategyRemove(item.id, strategy);
                                 }}
                               />
                             </Badge>
                           ))}
                           {addingStrategyToItem === item.id ? (
                             <Select 
                               value={newStrategyValue} 
                               onValueChange={(value) => {
                                 handleStrategyAdd(item.id, value);
                                 setNewStrategyValue("");
                                 setAddingStrategyToItem(null);
                               }}
                               onOpenChange={(open) => {
                                 if (!open) {
                                   setAddingStrategyToItem(null);
                                   setNewStrategyValue("");
                                 }
                               }}
                             >
                               <SelectTrigger className="h-6 text-xs w-32">
                                 <SelectValue placeholder="Select strategy" />
                               </SelectTrigger>
                               <SelectContent>
                                 {STRATEGIES.filter(strategy => 
                                   !normalizeStrategies(displayData.strategy).includes(strategy)
                                 ).map(strategyOption => (
                                   <SelectItem key={strategyOption} value={strategyOption}>
                                     {strategyOption}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           ) : (
                             <Badge 
                               variant="outline" 
                               className="text-xs text-muted-foreground vault-tag cursor-pointer hover:bg-muted flex items-center gap-1"
                               style={{ backgroundColor: '#F4F4F5' }}
                               onClick={() => setAddingStrategyToItem(item.id)}
                             >
                               <Lightbulb className="h-3 w-3" />
                               + Strategy
                             </Badge>
                           )}
                           {displayData.tags.map(tag => (
                             <Badge key={tag} variant="outline" className="text-xs vault-tag flex items-center gap-1" style={{ backgroundColor: '#F4F4F5' }}>
                               {tag}
                               <X 
                                 className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                 onClick={() => handleTagRemove(item.id, tag)}
                               />
                             </Badge>
                           ))}
                           {addingTagToItem === item.id ? (
                             <div className="flex items-center gap-1">
                               <Input
                                 value={newTagValue}
                                 onChange={(e) => setNewTagValue(e.target.value)}
                                 className="h-6 text-xs w-20"
                                 placeholder="Tag name"
                                 autoFocus
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') handleNewTagSave(item.id);
                                   if (e.key === 'Escape') handleNewTagCancel();
                                 }}
                               />
                                <button 
                                  className="h-6 w-6 flex items-center justify-center border border-green-200 bg-white hover:bg-green-50 rounded text-green-600 hover:text-green-700 hover:border-green-300 transition-colors" 
                                  onClick={() => handleNewTagSave(item.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button 
                                  className="h-6 w-6 flex items-center justify-center border border-red-200 bg-white hover:bg-red-50 rounded text-red-500 hover:text-red-600 hover:border-red-300 transition-colors" 
                                  onClick={handleNewTagCancel}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                             </div>
                           ) : (
                             <Badge 
                               variant="outline" 
                               className="text-xs text-muted-foreground vault-tag cursor-pointer hover:bg-muted"
                               style={{ backgroundColor: '#F4F4F5' }}
                               onClick={() => setAddingTagToItem(item.id)}
                             >
                               + New
                             </Badge>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                {/* Action Footer */}
                <div className="border-t border-[#E4E4E7] px-6 py-3 flex items-center justify-end gap-2 rounded-b-lg" style={{ backgroundColor: '#fafafa' }}>
                  <button 
                    className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium"
                    style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button 
                    className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium"
                    style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium" style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}>
                        <Mail className="h-4 w-4" />
                        Email
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Open in Gmail</DropdownMenuItem>
                      <DropdownMenuItem>Open in Mail</DropdownMenuItem>
                      <DropdownMenuItem>Open in Outlook</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button 
                    className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md text-sm font-medium"
                    style={{ backgroundColor: '#18181B', color: '#fafafa', boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
                    onClick={() => handleCopyAnswer(displayData.answer || '')}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>
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