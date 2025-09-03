import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [queryTokenDimensions, setQueryTokenDimensions] = useState<{width: number, height: number} | null>(null);
  const queryButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedStrategy, setSelectedStrategy] = useState(searchParams.get('strategy') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  // Filter items based on search and filters
  const filteredItems = MOCK_CONTENT_ITEMS.filter(item => {
    const matchesQuery = !query || 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content?.question?.toLowerCase().includes(query.toLowerCase()) ||
      item.content?.answer?.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    
    const matchesStrategy = !selectedStrategy || item.strategy === selectedStrategy;
    const matchesType = !selectedType || item.type === selectedType;
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => item.tags.includes(tag));
    
    return matchesQuery && matchesStrategy && matchesType && matchesTags;
  });

  const hasActiveFilters = selectedStrategy || selectedType || selectedTags.length > 0;

  const clearFilters = () => {
    setSelectedStrategy('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedTags([]);
    navigate(`/vault/search?query=${query}`);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    
    const params = new URLSearchParams();
    params.set('query', query);
    if (selectedStrategy) params.set('strategy', selectedStrategy);
    if (selectedType) params.set('type', selectedType);
    if (selectedStatus) params.set('status', selectedStatus);
    if (newTags.length > 0) params.set('tags', newTags.join(','));
    
    navigate(`/vault/search?${params.toString()}`);
  };

  const handleQueryEdit = (newQuery: string) => {
    setQueryState(newQuery);
    setQuery(newQuery);
    
    const params = new URLSearchParams();
    params.set('query', newQuery);
    if (selectedStrategy) params.set('strategy', selectedStrategy);
    if (selectedType) params.set('type', selectedType);
    if (selectedStatus) params.set('status', selectedStatus);
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
            <div className="relative transition-all duration-250">
              {isEditingQuery ? (
                <Input
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
                  className="font-medium text-lg border-dashed border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-1 py-0.5 focus-visible:ring-0 bg-transparent"
                  style={queryTokenDimensions ? {
                    width: `${queryTokenDimensions.width}px`,
                    height: `${queryTokenDimensions.height}px`
                  } : undefined}
                  autoFocus
                />
              ) : (
                <button
                  ref={queryButtonRef}
                  onClick={() => {
                    if (queryButtonRef.current) {
                      const rect = queryButtonRef.current.getBoundingClientRect();
                      setQueryTokenDimensions({
                        width: rect.width,
                        height: rect.height
                      });
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
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Types" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTags.join(',')} onValueChange={(value) => setSelectedTags(value ? [value] : [])}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="ESG">ESG</SelectItem>
                  <SelectItem value="RFP">RFP</SelectItem>
                  <SelectItem value="Policy">Policy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedStrategy && (
                <Badge variant="secondary" className="gap-1">
                  {selectedStrategy}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedStrategy('')}
                  />
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1">
                  {selectedType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedType('')}
                  />
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
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
            const isFirstResult = index === 0;
            const isExpanded = expandedAnswers.has(item.id);
            const answer = item.content?.answer || '';
            const shouldTruncate = answer.length > 300;
            const displayAnswer = isExpanded ? answer : answer.substring(0, 300);
            
            return (
          <div className="border rounded-lg p-6 bg-card space-y-4 vault-result-card">
            {/* Header with file info and badge */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>
                      {formatRelativeTime(item.updatedAt)} ({formatFullDate(item.updatedAt)})
                    </span>
                    <User className="h-3 w-3" />
                    <span>{item.updatedBy}</span>
                  </div>
                </div>
              </div>
              
              {isFirstResult && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Best Answer
                </Badge>
              )}
            </div>

                {/* Answer Section */}
                {item.content?.answer && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Answer</h4>
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
                {item.content?.question && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Question</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.content.question}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="vault-tag">Evergreen</Badge>
                  <Badge variant="outline" className="vault-tag">{item.strategy}</Badge>
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs vault-tag">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs text-muted-foreground vault-tag">
                    + New
                  </Badge>
                </div>

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