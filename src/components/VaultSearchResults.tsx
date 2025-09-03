import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { 
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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VaultEditSheet } from "./VaultEditSheet";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS } from "@/types/vault";
import { ContentItem } from "@/types/vault";

export function VaultSearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, setQuery, setFilters } = useVaultState();
  const { edits, saveEdit, getEdit } = useVaultEdits();
  
  const [query, setQueryState] = useState(searchParams.get('query') || '');
  const [isEditingQuery, setIsEditingQuery] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [minWidth, setMinWidth] = useState(100);
  const [currentWidth, setCurrentWidth] = useState(100);
  const queryButtonRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Helper function to merge original item with saved edits
  const getDisplayData = (item: ContentItem) => {
    const savedEdit = getEdit(item.id);
    if (!savedEdit) return item;

    return {
      ...item,
      content: {
        ...item.content,
        question: savedEdit.question || item.content?.question,
        answer: savedEdit.answer || item.content?.answer,
      },
      strategy: savedEdit.strategy || item.strategy,
      tags: savedEdit.tags || item.tags,
    };
  };

  // Filter items based on search and filters (using merged data)
  const filteredItems = MOCK_CONTENT_ITEMS.filter(item => {
    const displayData = getDisplayData(item);
    
    const matchesQuery = !query || 
      displayData.title.toLowerCase().includes(query.toLowerCase()) ||
      displayData.content?.question?.toLowerCase().includes(query.toLowerCase()) ||
      displayData.content?.answer?.toLowerCase().includes(query.toLowerCase()) ||
      displayData.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    
    const matchesStrategy = selectedStrategies.length === 0 || 
      selectedStrategies.includes(displayData.strategy);
    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.includes(displayData.type);
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => displayData.tags.includes(tag));
    const matchesStatus = selectedStatuses.length === 0 || 
      selectedStatuses.includes(displayData.type); // Using type as status for mock data
    
    return matchesQuery && matchesStrategy && matchesType && matchesTags && matchesStatus;
  });

  const hasActiveFilters = selectedStrategies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0;

  const clearFilters = () => {
    setSelectedStrategies([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedTags([]);
    navigate(`/vault/search?query=${query}`);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    
    const params = new URLSearchParams();
    params.set('query', query);
    if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
    if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
    if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
    if (newTags.length > 0) params.set('tags', newTags.join(','));
    
    navigate(`/vault/search?${params.toString()}`);
  };

  // Dynamic width calculation
  const measureTextWidth = (text: string) => {
    if (!measureRef.current) return minWidth;
    measureRef.current.textContent = `"${text}"`;
    const measuredWidth = measureRef.current.offsetWidth;
    return Math.max(minWidth, Math.min(measuredWidth + 16, window.innerWidth * 0.8)); // 16px for padding
  };

  // Update width when query changes in edit mode
  useEffect(() => {
    if (isEditingQuery) {
      const newWidth = measureTextWidth(query);
      setCurrentWidth(newWidth);
    }
  }, [query, isEditingQuery, minWidth]);

  const handleQueryEdit = (newQuery: string) => {
    setQueryState(newQuery);
    setQuery(newQuery);
    
    const params = new URLSearchParams();
    params.set('query', newQuery);
    if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
    if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
    if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    
    navigate(`/vault/search?${params.toString()}`, { replace: true });
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

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

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
  };

  const handleSave = (itemId: string, editData: any) => {
    saveEdit(itemId, editData);
    setEditingItem(null);
  };

  const handleTagAdd = (id: string, tag: string) => {
    // Update localStorage with new tag
    const existingEdits = JSON.parse(localStorage.getItem('vaultEdits') || '{}');
    const currentEdit = existingEdits[id] || {};
    const originalItem = MOCK_CONTENT_ITEMS.find(item => item.id === id);
    const currentTags = currentEdit.tags || originalItem?.tags || [];
    
    if (!currentTags.includes(tag)) {
      existingEdits[id] = { ...currentEdit, tags: [...currentTags, tag] };
      localStorage.setItem('vaultEdits', JSON.stringify(existingEdits));
    }
  };

  const handleTagRemove = (id: string, tag: string) => {
    // Update localStorage removing tag
    const existingEdits = JSON.parse(localStorage.getItem('vaultEdits') || '{}');
    const currentEdit = existingEdits[id] || {};
    const originalItem = MOCK_CONTENT_ITEMS.find(item => item.id === id);
    const currentTags = currentEdit.tags || originalItem?.tags || [];
    
    existingEdits[id] = { ...currentEdit, tags: currentTags.filter(t => t !== tag) };
    localStorage.setItem('vaultEdits', JSON.stringify(existingEdits));
    // Force re-render
    window.dispatchEvent(new Event('storage'));
  };

  const handleNewTagSave = (itemId: string) => {
    if (newTagValue.trim()) {
      handleTagAdd(itemId, newTagValue.trim());
      setNewTagValue("");
      setAddingTagToItem(null);
      // Force re-render
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleNewTagCancel = () => {
    setNewTagValue("");
    setAddingTagToItem(null);
  };

  const handleQuickEdit = (id: string, field: string, value: string) => {
    // Update localStorage with field change
    const existingEdits = JSON.parse(localStorage.getItem('vaultEdits') || '{}');
    existingEdits[id] = { ...existingEdits[id], [field]: value };
    localStorage.setItem('vaultEdits', JSON.stringify(existingEdits));
  };

  const exportData = (format: string) => {
    console.log(`Exporting ${filteredItems.length} results as ${format}`);
    // Implementation would depend on format
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header with Breadcrumbs */}
      <div className="border-b bg-background">
        <div className="p-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mb-4">
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
            <span className="text-foreground">ai policy guidelines and regulations</span>
          </div>

          {/* Title with editable query */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{filteredItems.length} Results for</span>
            <div className="relative">
              {/* Hidden measuring element */}
              <span 
                ref={measureRef}
                className="absolute -top-96 left-0 font-medium text-lg px-1 pointer-events-none opacity-0"
                aria-hidden="true"
              />
              
              {isEditingQuery ? (
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQueryState(e.target.value)}
                  onBlur={() => {
                    setIsEditingQuery(false);
                    handleQueryEdit(query);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingQuery(false);
                      handleQueryEdit(query);
                    } else if (e.key === 'Escape') {
                      setIsEditingQuery(false);
                      setQueryState(searchParams.get('query') || '');
                    }
                  }}
                  className="font-medium text-lg border-dashed border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-1 py-0.5 focus-visible:ring-0 bg-transparent transition-all duration-200"
                  style={{
                    width: `${currentWidth}px`,
                    minWidth: `${minWidth}px`,
                    maxWidth: '80vw'
                  }}
                  autoFocus
                />
              ) : (
                <button
                  ref={queryButtonRef}
                  onClick={() => {
                    if (queryButtonRef.current) {
                      const rect = queryButtonRef.current.getBoundingClientRect();
                      setMinWidth(rect.width);
                      setCurrentWidth(rect.width);
                    }
                    setIsEditingQuery(true);
                  }}
                  className="font-medium text-lg border-dashed border-b-2 border-foreground hover:bg-muted px-1 py-0.5 rounded-none transition-colors duration-250"
                >
                  "{query}"
                </button>
              )}
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
                  const params = new URLSearchParams();
                  params.set('query', query);
                  if (values.length > 0) params.set('strategy', values.join(','));
                  if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
                  if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
                  if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                  navigate(`/vault/search?${params.toString()}`, { replace: true });
                }}
              />

              <MultiSelectFilter
                title="Types"
                options={CONTENT_TYPES}
                selectedValues={selectedTypes}
                onSelectionChange={(values) => {
                  setSelectedTypes(values);
                  const params = new URLSearchParams();
                  params.set('query', query);
                  if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
                  if (values.length > 0) params.set('type', values.join(','));
                  if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
                  if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                  navigate(`/vault/search?${params.toString()}`, { replace: true });
                }}
              />

              <MultiSelectFilter
                title="Tags"
                options={["AI", "ESG", "RFP", "Policy", "Risk Management", "Investment Strategy", "Portfolio Management", "Asset Management", "Financial Services", "Financial Analysis"]}
                selectedValues={selectedTags}
                onSelectionChange={(values) => {
                  setSelectedTags(values);
                  const params = new URLSearchParams();
                  params.set('query', query);
                  if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
                  if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
                  if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
                  if (values.length > 0) params.set('tags', values.join(','));
                  navigate(`/vault/search?${params.toString()}`, { replace: true });
                }}
              />

              <MultiSelectFilter
                title="Status"
                options={STATUS_OPTIONS}
                selectedValues={selectedStatuses}
                onSelectionChange={(values) => {
                  setSelectedStatuses(values);
                  const params = new URLSearchParams();
                  params.set('query', query);
                  if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
                  if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
                  if (values.length > 0) params.set('status', values.join(','));
                  if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                  navigate(`/vault/search?${params.toString()}`, { replace: true });
                }}
              />
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
                      const params = new URLSearchParams();
                      params.set('query', query);
                      if (newStrategies.length > 0) params.set('strategy', newStrategies.join(','));
                      if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
                      if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
                      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                      navigate(`/vault/search?${params.toString()}`);
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
                      const params = new URLSearchParams();
                      params.set('query', query);
                      if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
                      if (newTypes.length > 0) params.set('type', newTypes.join(','));
                      if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
                      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                      navigate(`/vault/search?${params.toString()}`);
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
                      const params = new URLSearchParams();
                      params.set('query', query);
                      if (selectedStrategies.length > 0) params.set('strategy', selectedStrategies.join(','));
                      if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));
                      if (newStatuses.length > 0) params.set('status', newStatuses.join(','));
                      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                      navigate(`/vault/search?${params.toString()}`);
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
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No results match your filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const displayData = getDisplayData(item);
            const hasEdits = !!getEdit(item.id);
            const isFirstResult = index === 0;
            const isExpanded = expandedAnswers.has(item.id);
            const answer = displayData.content?.answer || '';
            const shouldTruncate = answer.length > 300;
            const displayAnswer = isExpanded ? answer : answer.substring(0, 300);
            
            return (
          <div className="border rounded-lg p-6 bg-card space-y-4 vault-result-card">
            {/* Header with file info and badge */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7]">
              <div className="flex items-center gap-3 text-sm" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <FileText className="h-4 w-4" style={{ color: '#71717A' }} />
                <span className="font-bold">{item.title}</span>
                <Calendar className="h-4 w-4 ml-2" style={{ color: '#71717A' }} />
                <span style={{ color: '#27272A' }}>{formatRelativeTime(item.updatedAt)}</span>
                <span style={{ color: '#71717A' }}>({formatFullDate(item.updatedAt)})</span>
                <UsersRound className="h-4 w-4 ml-2" style={{ color: '#71717A' }} />
                <span>{item.updatedBy}</span>
                {hasEdits && (
                  <Badge variant="outline" className="text-xs ml-2">
                    Edited
                  </Badge>
                )}
              </div>
              
              {isFirstResult && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#CCECB6', color: '#09090B' }}>
                  <Star className="h-3 w-3" />
                  <span className="text-xs font-semibold">Best Answer</span>
                </div>
              )}
            </div>

                 {/* Answer Section */}
                 {displayData.content?.answer && (
                   <div className="space-y-2">
                     <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Answer</h4>
                     <div className="bg-muted/50 rounded-md p-4">
                       <p className="text-sm leading-relaxed">
                         {displayAnswer}
                         {shouldTruncate && !isExpanded && '...'}
                       </p>
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
                 {displayData.content?.question && (
                   <div className="space-y-2" style={{ paddingInlineStart: '20px' }}>
                     <div className="flex items-start gap-2">
                       <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#71717A' }} />
                       <div className="space-y-2">
                         <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Question</h4>
                         <p style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '700', letterSpacing: '-0.4px' }}>
                           {displayData.content.question}
                         </p>
                         
                         {/* Tags in Question Section */}
                         <div className="flex flex-wrap items-center gap-2 mt-3">
                           <Badge variant="outline" className="vault-tag" style={{ backgroundColor: '#F4F4F5' }}>Evergreen</Badge>
                           <Badge variant="outline" className="vault-tag" style={{ backgroundColor: '#F4F4F5' }}>{displayData.strategy}</Badge>
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
                               <Check 
                                 className="h-3 w-3 cursor-pointer text-green-600 hover:text-green-700" 
                                 onClick={() => handleNewTagSave(item.id)}
                               />
                               <X 
                                 className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-600" 
                                 onClick={handleNewTagCancel}
                               />
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

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Add to Collection</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Send via Email</DropdownMenuItem>
                      <DropdownMenuItem>Create Email Template</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
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