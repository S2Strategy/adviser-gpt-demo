import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { QuestionCard } from "./QuestionCard";
import { VaultEditSheet } from "./VaultEditSheet";
import { FirmUpdatesModal } from "./FirmUpdatesModal";
import { FindDuplicatesModal } from "./FindDuplicatesModal";
import { SmartUploadSheet } from "./SmartUploadSheet";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal, 
  FileText, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Building2,
  Upload,
  Shapes,
  Lightbulb,
  Database,
  Clock,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS, TAGS_INFO, QuestionItem } from "@/types/vault";
import { MultiSelectFilter } from "./MultiSelectFilter";

export function VaultHomepage() {
  const navigate = useNavigate();
  const { state, setQuery, setFilters, setActiveView } = useVaultState();
  const { edits, saveEdit, getEdit } = useVaultEdits();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState(state.query);
  const [selectedStrategy, setSelectedStrategy] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<"name" | "totalItems" | "lastEdited" | "lastEditor">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
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

  // Helper function to get the appropriate sort icon
  const getSortIcon = (column: "name" | "totalItems" | "lastEdited" | "lastEditor") => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

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
      
      const params = new URLSearchParams();
      // Only set query param if there's actual search text
      if (hasSearchText) {
        params.set('query', searchInput);
      }
      if (selectedStrategy.length > 0) params.set('strategy', selectedStrategy.join(','));
      if (selectedType.length > 0) params.set('type', selectedType.join(','));
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (selectedStatus.length > 0) params.set('status', selectedStatus.join(','));
      
      navigate(`/vault/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Group items by file for Files view
  const fileGroups = MOCK_CONTENT_ITEMS.map(doc => ({
    name: doc.title,
    totalItems: doc.items.length,
    type: doc.items[0]?.type || "Questionnaire",
    strategy: doc.items[0]?.strategy || "Firm-Wide (Not Strategy-Specific)",
    tags: doc.items.flatMap(item => item.tags),
    updatedAt: doc.items[0]?.updatedAt || new Date().toISOString(),
    updatedBy: doc.items[0]?.updatedBy || "Unknown",
    documentId: doc.id
  }));

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

  const toggleSort = (column: "name" | "totalItems" | "lastEdited" | "lastEditor") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Group by type for Type view
  const typeGroups = CONTENT_TYPES.map(type => ({
    name: type,
    totalItems: allItems.filter(item => item.type === type).length
  })).filter(group => group.totalItems > 0);

  // Group by strategy for Strategy view
  const strategyGroups = STRATEGIES.map(strategy => ({
    name: strategy,
    totalItems: allItems.filter(item => {
      const itemStrategy = Array.isArray(item.strategy) ? item.strategy : [item.strategy];
      return itemStrategy.includes(strategy);
    }).length
  })).filter(group => group.totalItems > 0);

  // Get the 5 most recently edited questions
  const recentQuestions = allItems
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

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

  const handleStrategyAdd = (id: string, strategy: string) => {
    const currentEdit = getEdit(id) || {};
    const originalItem = allItems.find(item => item.id === id);
    const currentStrategies = normalizeStrategies(currentEdit.strategy || originalItem?.strategy || []);
    
    if (!currentStrategies.includes(strategy)) {
      saveEdit(id, { ...currentEdit, strategy: [...currentStrategies, strategy] });
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col ml-64">
        {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-6">
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
              className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-[#E4E4E7] bg-white text-[#18181B] text-sm font-medium leading-tight tracking-tight hover:border-[#D4D4D8] hover:bg-[#FAFAFA] transition-colors capitalize"
            >
              <Copy className="h-4 w-4 mr-2" />
              Find duplicates
            </Button>
            <Button 
              onClick={() => setShowFirmUpdatesModal(true)}
              className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-[#E4E4E7] bg-white text-[#18181B] text-sm font-medium leading-tight tracking-tight hover:border-[#D4D4D8] hover:bg-[#FAFAFA] transition-colors capitalize"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Firm updates
            </Button>
            <Button 
              onClick={() => setShowSmartUploadSheet(true)}
              className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md bg-[#F4F4F5] shadow-[0_0_0_1px_rgba(3,7,18,0.12),0_1px_3px_-1px_rgba(3,7,18,0.11),0_2px_5px_0_rgba(3,7,18,0.06)] text-[#18181B] text-sm font-medium leading-tight tracking-tight hover:bg-[#F1F1F1] hover:shadow-[0_0_0_1px_rgba(3,7,18,0.15),0_1px_4px_-1px_rgba(3,7,18,0.13),0_3px_6px_0_rgba(3,7,18,0.08)] transition-all capitalize"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload new
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search or filter my Vault..."
                className="pl-10 h-12"
              />
            </div>
            
            <MultiSelectFilter
              title="Strategy"
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
              className="bg-black text-white hover:bg-black/90 px-6 h-12 min-w-32"
            >
              Find
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="h-full">
          {/* Main Tabs - Custom Styling */}
          <div className="flex items-center gap-8 mb-6 border-b">
            <button
              onClick={() => handleTabChange("documents")}
              className={`flex items-center gap-2 pb-4 text-lg font-medium transition-colors ${
                activeTab === "documents"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
                  : "text-muted-foreground hover:text-foreground"
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
                  <p className="text-muted-foreground">Most recently edited questions and answers</p>
                </div>
              </div>

              {/* Recent Question Cards */}
              <div className="space-y-4">
                {recentQuestions.map((item) => {
                  const hasEdits = !!getEdit(item.id);
                  const isExpanded = expandedAnswers.has(item.id);
                  
                  return (
                    <QuestionCard
                      key={item.id}
                      item={item}
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
                      highlightSearchTerms={highlightSearchTerms}
                      formatRelativeTime={formatRelativeTime}
                      formatFullDate={formatFullDate}
                    />
                  );
                })}
                {recentQuestions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground mb-4">
                      No recent questions found.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/vault/search')}>
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
                  className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Files
                </TabsTrigger>
                <TabsTrigger 
                  value="type"
                  className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
                >
                  <Shapes className="h-4 w-4" />
                  Type
                </TabsTrigger>
                <TabsTrigger 
                  value="strategy"
                  className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  Strategy
                </TabsTrigger>
                <TabsTrigger 
                  value="data"
                  className="inline-grid grid-flow-col items-center content-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
                >
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Files</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-2"
                      >
                        Name
                        {getSortIcon("name")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("totalItems")}
                        className="flex items-center gap-2"
                      >
                        Items
                        {getSortIcon("totalItems")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("lastEdited")}
                        className="flex items-center gap-2"
                      >
                        Last Edited
                        {getSortIcon("lastEdited")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("lastEditor")}
                        className="flex items-center gap-2"
                      >
                        Last Editor
                        {getSortIcon("lastEditor")}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {sortedFiles.map((file) => (
                      <div
                        key={file.documentId}
                        className="flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/vault/file?fileName=${encodeURIComponent(file.name)}&count=${file.totalItems}`)}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{file.name}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                {file.totalItems} {file.totalItems === 1 ? "item" : "items"}
                              </div>
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                {file.type}
                              </div>
                              <div className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                <span style={{ color: '#71717A' }}>Last edited</span> {formatRelativeTime(file.updatedAt)} <span style={{ color: '#71717A' }}>by</span> {file.updatedBy}
                              </div>
                          </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="type" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Content Types</h3>
                  <div className="grid gap-4">
                    {typeGroups.map((type) => (
                      <div
                        key={type.name}
                        className="flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedType([type.name]);
                          navigate(`/vault/search?type=${type.name}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Shapes className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{type.name}</h4>
                            <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                              {type.totalItems} {type.totalItems === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                        className="flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedStrategy([group.name]);
                          navigate(`/vault/search?strategy=${group.name}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{group.name}</h4>
                            <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                              {group.totalItems} {group.totalItems === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">Total Documents</h4>
                      </div>
                      <p className="text-2xl font-bold">{MOCK_CONTENT_ITEMS.length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">Total Questions</h4>
                      </div>
                      <p className="text-2xl font-bold">{allItems.length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shapes className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium">Content Types</h4>
                      </div>
                      <p className="text-2xl font-bold">{typeGroups.length}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          )}
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