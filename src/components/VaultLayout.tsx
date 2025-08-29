import { useState, useEffect } from "react";
import { Search, Upload, Copy, Building, Tag, ChevronDown, Filter, ArrowUpDown, Download, X, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuestionCard, QuestionCardData } from "./QuestionCard";
import { QuestionSheet } from "./QuestionSheet";
import { SingleFileView } from "./SingleFileView";
import { AppSidebar } from "./AppSidebar";
import { EnhancedSearchBar } from "./EnhancedSearchBar";
import { TagCloud } from "./TagCloud";
import { SavedSearches } from "./SavedSearches";
import { useDebounce } from "@/hooks/useDebounce";

// Enhanced mock data with content types and expiration dates
const mockContentItems: QuestionCardData[] = [
  {
    id: "1",
    fileName: "AI_Policy_Document_April_2025",
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedBy: "Brian",
    question: "What specific pre-approval requirements must Granite Peak employees adhere to when using AI Systems involving proprietary information?",
    answer: "II. PRE-APPROVAL REQUIREMENT Granite Peak employees are prohibited from using any AI Systems involving the consumption of data or proprietary information related to Granite Peak's business without specific authorization from the Deputy CCO and the Director of Operations.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["DDQ", "RFP", "Policy", "AI"],
    contentType: "Policy",
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  {
    id: "2", 
    fileName: "Large-Cap All-Star Fund: Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedBy: "Mary",
    question: "What is your investment approach for large-cap growth strategies?",
    answer: "Our large-cap growth strategy focuses on companies with sustainable competitive advantages, strong management teams, and consistent earnings growth. We employ a fundamental research approach...",
    duration: "2 Years",
    strategy: "Large Cap Growth",
    tags: ["Investment Strategy", "RFP", "Growth"],
    contentType: "RFP",
    expirationDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 years from now
  },
  {
    id: "3",
    fileName: "ESG Triple-Double Fund: Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedBy: "Sarah",
    question: "How do you integrate ESG factors into your investment process?",
    answer: "ESG integration is fundamental to our investment process. We evaluate environmental, social, and governance factors alongside traditional financial metrics to identify sustainable investment opportunities...",
    duration: "1 Year",
    strategy: "Small Cap Growth",
    tags: ["ESG", "Sustainability", "RFP", "Environmental"],
    contentType: "RFP",
    expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now (expiring soon)
  },
  {
    id: "4",
    fileName: "Investment Management Proposal",
    updatedAt: new Date(Date.now() - 345600000), // 4 days ago
    updatedBy: "John",
    question: "What are your risk management procedures?",
    answer: "Our risk management framework includes portfolio diversification, position sizing limits, stress testing, and regular risk monitoring. We employ quantitative and qualitative risk assessment tools...",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["Risk Management", "Policy", "Compliance"],
    contentType: "Policy",
  },
  {
    id: "5",
    fileName: "Comprehensive Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 432000000), // 5 days ago
    updatedBy: "Alex",
    question: "What is your fee structure?",
    answer: "Our management fees are tiered based on assets under management and investment strategy. For institutional accounts over $50 million, our standard fee schedule ranges from 0.75% to 1.25%...",
    duration: "6 Months",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["Fees", "Commercial", "DDQ", "Pricing"],
    contentType: "DDQ",
    expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago (expired)
  }
];

const strategies = [
  "All Strategies",
  "Firm Wide (Not Strategy Specific)",
  "Large Cap Growth", 
  "Small Cap Growth"
];

const contentTypes = [
  "All Types",
  "RFP",
  "DDQ", 
  "Policy",
  "Commentary"
];

const sortOptions = [
  { label: "Last Updated", value: "lastUpdated" },
  { label: "Expiration Date", value: "expirationDate" },
  { label: "Relevance", value: "relevance" }
];

export function VaultLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionCardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [selectedStrategy, setSelectedStrategy] = useState("All Strategies");
  const [selectedContentType, setSelectedContentType] = useState("All Types");
  const [sortBy, setSortBy] = useState("lastUpdated");
  
  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleBackFromFile = () => {
    setSelectedFile(null);
  };

  const handleEditQuestion = (questionData: QuestionCardData) => {
    setEditingQuestion(questionData);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStrategy("All Strategies");
    setSelectedContentType("All Types");
    setSelectedTags([]);
    setSortBy("lastUpdated");
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleTagAdd = (id: string, tag: string) => {
    // Mock implementation - in real app would update backend
    console.log(`Adding tag "${tag}" to item ${id}`);
  };

  const handleTagRemove = (id: string, tag: string) => {
    // Mock implementation - in real app would update backend
    console.log(`Removing tag "${tag}" from item ${id}`);
  };

  const handleQuickEdit = (id: string, field: string, value: string) => {
    // Mock implementation - in real app would update backend
    console.log(`Updating ${field} to "${value}" for item ${id}`);
  };

  const handleLoadSavedSearch = (searchData: { query: string; filters: { strategy?: string; contentType?: string; tags?: string[]; }; }) => {
    setSearchQuery(searchData.query);
    setSelectedStrategy(searchData.filters.strategy || "All Strategies");
    setSelectedContentType(searchData.filters.contentType || "All Types");
    setSelectedTags(searchData.filters.tags || []);
  };

  // Enhanced filter and sort logic
  const filteredItems = mockContentItems.filter(item => {
    const matchesSearch = debouncedSearchQuery === "" || 
      item.question.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      item.strategy.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.updatedBy.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    const matchesStrategy = selectedStrategy === "All Strategies" || item.strategy === selectedStrategy;
    const matchesContentType = selectedContentType === "All Types" || item.contentType === selectedContentType;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag));
    
    return matchesSearch && matchesStrategy && matchesContentType && matchesTags;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "lastUpdated":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case "expirationDate":
        // Mock sort by expiration (you'd implement actual expiration logic)
        return a.duration.localeCompare(b.duration);
      case "relevance":
        // Mock relevance sort (you'd implement actual relevance scoring)
        return a.question.length - b.question.length;
      default:
        return 0;
    }
  });

  const activeFilters = [];
  if (debouncedSearchQuery) activeFilters.push({ type: "search", value: debouncedSearchQuery });
  if (selectedStrategy !== "All Strategies") activeFilters.push({ type: "strategy", value: selectedStrategy });
  if (selectedContentType !== "All Types") activeFilters.push({ type: "contentType", value: selectedContentType });
  if (selectedTags.length > 0) activeFilters.push({ type: "tags", value: selectedTags.join(", ") });

  const handleExport = (format: string) => {
    // Mock export functionality - in real app would implement actual export
    console.log(`Exporting ${sortedItems.length} items as ${format}`);
  };

  if (selectedFile) {
    return (
      <div className="min-h-screen bg-background flex">
        <AppSidebar />
        <div className="flex-1 ml-64">
          <SingleFileView 
            fileName={selectedFile}
            questionCount={2}
            onBack={handleBackFromFile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-vault-header border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-vault-header-foreground">Vault</h1>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    AI Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border z-50">
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Find Duplicates</div>
                      <div className="text-xs text-muted-foreground">Find duplicate questions across documents</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Building className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Edit Firm Details</div>
                      <div className="text-xs text-muted-foreground">Update firm information in all documents</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Update Tags</div>
                      <div className="text-xs text-muted-foreground">Batch update document tags</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mt-4 space-y-4">
            {/* Enhanced Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 max-w-2xl">
                <EnhancedSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  contentItems={mockContentItems}
                />
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {/* Advanced Filters Collapsible */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleContent className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Strategy Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Strategy</label>
                    <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Strategies" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-50">
                        {strategies.map(strategy => (
                          <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Type</label>
                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-50">
                        {contentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-50">
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tag Cloud */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Tags</label>
                  <TagCloud
                    contentItems={mockContentItems}
                    onTagClick={handleTagClick}
                    selectedTags={selectedTags}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Quick Filters Row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {strategies.map(strategy => (
                      <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {contentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border z-50">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('word')}>
                      Export as Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active Filters and Results Count */}
            {(activeFilters.length > 0 || sortedItems.length > 0) && (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeFilters.length > 0 && (
                    <>
                      {activeFilters.map((filter, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {filter.type === "search" && "Search: "}
                          {filter.type === "strategy" && "Strategy: "}
                          {filter.type === "contentType" && "Type: "}
                          {filter.type === "tags" && "Tags: "}
                          {filter.value}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              if (filter.type === "search") setSearchQuery("");
                              if (filter.type === "strategy") setSelectedStrategy("All Strategies");
                              if (filter.type === "contentType") setSelectedContentType("All Types");
                              if (filter.type === "tags") setSelectedTags([]);
                            }}
                          />
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {sortedItems.length} {sortedItems.length === 1 ? 'result' : 'results'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6 p-6">
          {/* Left Sidebar - Saved Searches */}
          <aside className="w-80 space-y-6">
            <SavedSearches
              onLoadSearch={handleLoadSavedSearch}
              currentQuery={searchQuery}
              currentFilters={{
                strategy: selectedStrategy,
                contentType: selectedContentType,
                tags: selectedTags,
              }}
            />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="max-w-4xl space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Loading...</h3>
                  <p className="text-muted-foreground">Searching your vault content...</p>
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query or filters to find what you're looking for.
                  </p>
                  {(searchQuery || selectedStrategy !== "All Strategies" || selectedContentType !== "All Types" || selectedTags.length > 0) && (
                    <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                sortedItems.map((item) => (
                  <QuestionCard 
                    key={item.id} 
                    data={item}
                    onEdit={handleEditQuestion}
                    onTagAdd={handleTagAdd}
                    onTagRemove={handleTagRemove}
                    onQuickEdit={handleQuickEdit}
                  />
                ))
              )}
            </div>
          </main>
        </div>

        {/* Edit Sheet */}
        {editingQuestion && (
          <QuestionSheet
            data={editingQuestion}
            open={!!editingQuestion}
            onOpenChange={(open) => !open && setEditingQuestion(null)}
          />
        )}
      </div>
    </div>
  );
}
