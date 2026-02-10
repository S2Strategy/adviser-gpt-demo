import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { VaultSidebar } from "@/components/VaultSidebar";
import { ChangeHistoryModal } from "@/components/ChangeHistoryModal";
import { FirmUpdatesModal } from "@/components/FirmUpdatesModal";
import { FindDuplicatesModal } from "@/components/FindDuplicatesModal";
import { QADetailModal } from "@/components/QADetailModal";
import {
  Search,
  ArrowLeft,
  Copy,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  X,
  Check,
  Archive,
  ArchiveRestore,
  Filter,
  Trash2,
  Edit,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVaultState, useVaultEdits } from "@/hooks/useVaultState";
import { useTagTypes } from "@/hooks/useTagTypes";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { QuestionItem, Tag } from "@/types/vault";
import { FiltersPanel, DateRange } from "@/components/FiltersPanel";
import { migrateQuestionItem, migrateQuestionItems } from "@/utils/tagMigration";
import { smartSearch } from "@/utils/smartSearch";
import { format, subDays, subMonths } from "date-fns";

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { state, setQuery, setSort, setShowArchived } = useVaultState();
  const { getEdit, saveEdit, saveManyEdits } = useVaultEdits();
  const { addToHistory } = useSearchHistory();
  const { toast } = useToast();
  const { getAllTagTypes, getTagTypeValues } = useTagTypes();
  const { profile } = useUserProfile();

  const fromRouter = (new URLSearchParams(location.search).get("query") || "").trim();
  const fromWindow =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("query") || "").trim()
      : "";
  const effectiveQuery = fromRouter || fromWindow;
  const fileName = searchParams.get("fileName");
  const isFileMode = !!fileName && effectiveQuery.length === 0;

  const [searchInput, setSearchInput] = useState(effectiveQuery);
  const [selectedTagFilters, setSelectedTagFilters] = useState<Record<string, string[]>>({});
  const [selectedStrategy, setSelectedStrategy] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedPriorSamples, setSelectedPriorSamples] = useState<string[]>([]);
  const [fileHistory] = useState<Array<{ id: string; name: string; type: string; size: number; uploadedAt: Date }>>([]);

  const currentSort = searchParams.get("sort") || state.sort || "lastUpdated";
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [qaSortColumn, setQaSortColumn] = useState<"question" | "answer" | "document" | "lastUpdated" | null>("lastUpdated");
  const [qaSortDirection, setQaSortDirection] = useState<"asc" | "desc">("desc");
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [contentBounds, setContentBounds] = useState<{ left: number; width: number } | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QuestionItem | null>(null);
  const [historyModalItemId, setHistoryModalItemId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalQuestion, setHistoryModalQuestion] = useState("");
  const [historyModalAnswer, setHistoryModalAnswer] = useState("");
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaModalItem, setQaModalItem] = useState<QuestionItem | null>(null);
  const [qaModalMode, setQaModalMode] = useState<"view" | "edit">("view");
  const [qaModalOpenedInMode, setQaModalOpenedInMode] = useState<"view" | "edit">("view");
  const [showFirmUpdatesModal, setShowFirmUpdatesModal] = useState(false);
  const [showFindDuplicatesModal, setShowFindDuplicatesModal] = useState(false);

  useEffect(() => {
    const queryFromUrl = (new URLSearchParams(location.search).get("query") || "").trim();
    const urlStrategy = searchParams.get("strategy")?.split(",").filter(Boolean) || [];
    const urlType = searchParams.get("type")?.split(",").filter(Boolean) || [];
    const urlTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const urlStatus = searchParams.get("status")?.split(",").filter(Boolean) || [];
    const urlShowArchived = searchParams.get("showArchived") === "true";
    const tagFilters: Record<string, string[]> = {};
    if (urlStrategy.length > 0) tagFilters["Strategy"] = urlStrategy;
    if (urlType.length > 0) tagFilters["Type"] = urlType;
    if (urlTags.length > 0) tagFilters["Category"] = urlTags;
    if (urlStatus.length > 0) tagFilters["Status"] = urlStatus;
    setSelectedTagFilters(tagFilters);
    setSelectedStrategy(urlStrategy);
    setSelectedType(urlType);
    setSelectedTags(urlTags);
    setSelectedStatus(urlStatus);
    setSearchInput((prev) => (prev === queryFromUrl ? prev : queryFromUrl));
    if (urlShowArchived !== state.showArchived) setShowArchived(urlShowArchived);
  }, [location.search]);

  useEffect(() => {
    const updateBounds = () => {
      if (searchResultsRef.current) {
        const rect = searchResultsRef.current.getBoundingClientRect();
        setContentBounds({ left: rect.left, width: rect.width });
      } else {
        setContentBounds(null);
      }
    };
    const t = setTimeout(updateBounds, 0);
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
    };
  }, [effectiveQuery]);

  const hasActiveFilters =
    Object.values(selectedTagFilters).some((v) => v.length > 0) ||
    selectedDocuments.length > 0 ||
    selectedPriorSamples.length > 0 ||
    (selectedDateRange && selectedDateRange.type !== "any");
  const totalFiltersCount =
    Object.values(selectedTagFilters).reduce((s, v) => s + v.length, 0) +
    selectedDocuments.length +
    selectedPriorSamples.length +
    (selectedDateRange && selectedDateRange.type !== "any" ? 1 : 0);

  const flattenItems = (): QuestionItem[] => {
    if (isFileMode && fileName) {
      const targetDoc = MOCK_CONTENT_ITEMS.find((doc) => doc.title === fileName);
      if (targetDoc) {
        return migrateQuestionItems(
          targetDoc.items.map((item) => ({ ...item, documentTitle: targetDoc.title, documentId: targetDoc.id }))
        );
      }
    }
    return migrateQuestionItems(
      MOCK_CONTENT_ITEMS.flatMap((doc) =>
        doc.items.map((item) => ({ ...item, documentTitle: doc.title, documentId: doc.id }))
      )
    );
  };
  const allItems = flattenItems();

  const getDisplayData = (item: QuestionItem) => {
    const savedEdit = getEdit(item.id);
    if (!savedEdit) return migrateQuestionItem(item);
    let tags = savedEdit.tags || item.tags;
    if (tags?.length && typeof (tags as unknown[])[0] === "string") {
      tags = migrateQuestionItem({ ...item, tags: tags as unknown as string[] }).tags;
    } else if (!tags?.length) {
      tags = migrateQuestionItem(item).tags;
    }
    return {
      ...item,
      question: savedEdit.question || item.question,
      answer: savedEdit.answer || item.answer,
      updatedAt: savedEdit.updatedAt || item.updatedAt,
      updatedBy: savedEdit.updatedBy || item.updatedBy,
      tags,
      archived: savedEdit.archived !== undefined ? savedEdit.archived : (item.archived || false),
    };
  };

  const getDateRangeBounds = (dateRange: DateRange | null): { from: Date; to: Date } | null => {
    if (!dateRange || dateRange.type === "any") return null;
    if (dateRange.type === "custom" && dateRange.from && dateRange.to) return { from: dateRange.from, to: dateRange.to };
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    switch (dateRange.type) {
      case "7d":
        return { from: subDays(today, 7), to: today };
      case "30d":
        return { from: subDays(today, 30), to: today };
      case "3mo":
        return { from: subMonths(today, 3), to: today };
      case "6mo":
        return { from: subMonths(today, 6), to: today };
      case "1y":
        return { from: subDays(today, 365), to: today };
      default:
        return null;
    }
  };

  const smartSearchResults = effectiveQuery ? smartSearch(allItems, effectiveQuery) : allItems;
  const filteredItems = smartSearchResults.filter((item) => {
    const displayData = getDisplayData(item);
    if (getEdit(item.id)?.deleted) return false;
    if (!state.showArchived && displayData.archived) return false;
    for (const [tagTypeName, selectedValues] of Object.entries(selectedTagFilters)) {
      if (selectedValues.length === 0) continue;
      const itemTags = (displayData.tags || []).filter((t: Tag) => t.type === tagTypeName);
      if (!selectedValues.some((v) => itemTags.some((t: Tag) => t.value === v))) return false;
    }
    if (selectedDocuments.length && !selectedDocuments.includes(displayData.documentTitle || "")) return false;
    const bounds = getDateRangeBounds(selectedDateRange);
    if (bounds) {
      try {
        const d = new Date(displayData.updatedAt);
        if (isNaN(d.getTime()) || d < bounds.from || d > bounds.to) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  const sortItems = (items: QuestionItem[], sortBy: string | null, direction: "asc" | "desc") => {
    if (!sortBy) return items;
    const getData = (i: QuestionItem) => getDisplayData(i);
    switch (sortBy) {
      case "lastUpdated":
      case "lastEdited":
        return [...items].sort((a, b) =>
          direction === "desc"
            ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case "question":
        return [...items].sort((a, b) =>
          direction === "desc"
            ? (b.question || "").toLowerCase().localeCompare((a.question || "").toLowerCase())
            : (a.question || "").toLowerCase().localeCompare((b.question || "").toLowerCase())
        );
      case "answer":
        return [...items].sort((a, b) =>
          direction === "desc"
            ? (getData(b).answer || "").localeCompare(getData(a).answer || "")
            : (getData(a).answer || "").localeCompare(getData(b).answer || "")
        );
      case "document":
        return [...items].sort((a, b) =>
          direction === "desc"
            ? (b.documentTitle || "").localeCompare(a.documentTitle || "")
            : (a.documentTitle || "").localeCompare(b.documentTitle || "")
        );
      default:
        return items;
    }
  };
  const sortedAndFilteredItems = sortItems(filteredItems, qaSortColumn, qaSortDirection);

  const handleColumnSort = (column: "question" | "answer" | "document" | "lastUpdated") => {
    setQaSortColumn(column);
    setQaSortDirection((prev) => (qaSortColumn === column ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const handleSearch = () => {
    const nextQuery = searchInput.trim();
    if (!nextQuery && !hasActiveFilters) return;
    setQuery(nextQuery);
    addToHistory(
      nextQuery,
      { strategies: selectedStrategy, types: selectedType, tags: selectedTags, statuses: selectedStatus },
      currentSort
    );
    const params = new URLSearchParams();
    if (nextQuery) params.set("query", nextQuery);
    if (selectedStrategy.length) params.set("strategy", selectedStrategy.join(","));
    if (selectedType.length) params.set("type", selectedType.join(","));
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (selectedStatus.length) params.set("status", selectedStatus.join(","));
    if (state.showArchived) params.set("showArchived", "true");
    if (currentSort && currentSort !== "relevance") params.set("sort", currentSort);
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSelectedTagFilters({});
    setSelectedDocuments([]);
    setSelectedDateRange(null);
    setSelectedPriorSamples([]);
    const params = new URLSearchParams();
    if (effectiveQuery) params.set("query", effectiveQuery);
    navigate(`/search?${params.toString()}`);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === sortedAndFilteredItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(sortedAndFilteredItems.map((i) => i.id)));
  };
  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSortChange = (sortValue: string) => {
    setSort(sortValue);
    const params = new URLSearchParams(searchParams);
    if (sortValue !== "relevance") params.set("sort", sortValue);
    else params.delete("sort");
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  const formatRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (isNaN(d.getTime())) return "today";
    const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 0) return "today";
    if (diff === 1) return "1 day ago";
    if (diff < 7) return `${diff} days ago`;
    if (diff <= 31) return `${Math.round(diff / 7)} week(s) ago`;
    if (diff < 365) return `${Math.round(diff / 30)} month(s) ago`;
    return `${Math.round(diff / 365)} year(s) ago`;
  };
  const formatFullDate = (iso: string) => (iso ? format(new Date(iso), "MMM d, yyyy h:mm a") : "");

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    toast({ title: "Copied", description: "Answer copied to clipboard." });
  };
  const handleArchive = (itemId: string) => {
    const currentEdit = getEdit(itemId) || {};
    const original = allItems.find((i) => i.id === itemId);
    const archived = currentEdit.archived ?? original?.archived ?? false;
    saveEdit(itemId, { ...currentEdit, archived: !archived });
    toast({ title: archived ? "Restored" : "Archived", description: archived ? "Item restored." : "Item archived." });
  };
  const handleViewHistory = (itemId: string, question: string, answer: string) => {
    setHistoryModalItemId(itemId);
    setHistoryModalQuestion(question);
    setHistoryModalAnswer(answer);
    setHistoryModalOpen(true);
  };
  const findOriginalItem = (itemId: string): QuestionItem | undefined =>
    allItems.find((i) => i.id === itemId) ||
    MOCK_CONTENT_ITEMS.flatMap((d) => d.items).find((i) => i.id === itemId);
  const handleOpenQAModal = (item: QuestionItem, mode: "view" | "edit" = "view") => {
    setQaModalItem(item);
    setQaModalMode(mode);
    setQaModalOpenedInMode(mode);
    setQaModalOpen(true);
  };
  const handleEdit = (item: QuestionItem) => handleOpenQAModal(item, "edit");
  const handleQAModalSave = (editData: { question: string; answer: string; tags: Tag[]; updatedAt: string; updatedBy: string }) => {
    if (!qaModalItem) return;
    saveEdit(qaModalItem.id, editData, findOriginalItem(qaModalItem.id));
  };
  const handleQAModalModeChange = (mode: "view" | "edit") => setQaModalMode(mode);

  const handleBulkTagAdd = (tag: { type: string; value: string }) => {
    if (selectedItems.size === 0) return;
    const entries: Array<[string, QuestionItem]> = [];
    selectedItems.forEach((itemId) => {
      const currentEdit = getEdit(itemId) || {};
      const original = allItems.find((i) => i.id === itemId);
      const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || original?.tags || [];
      if (!currentTags.some((t) => t.type === tag.type && t.value === tag.value)) {
        entries.push([itemId, { ...(original || {}), ...currentEdit, tags: [...currentTags, tag] } as QuestionItem]);
      }
    });
    if (entries.length) {
      saveManyEdits(entries);
      toast({ title: "Tags added", description: `Added to ${entries.length} item(s).` });
      setSelectedItems(new Set());
    }
  };
  const handleBulkTagRemove = (tag: { type: string; value: string }) => {
    if (selectedItems.size === 0) return;
    const entries: Array<[string, QuestionItem]> = [];
    selectedItems.forEach((itemId) => {
      const currentEdit = getEdit(itemId) || {};
      const original = allItems.find((i) => i.id === itemId);
      const currentTags: Array<{ type: string; value: string }> = currentEdit.tags || original?.tags || [];
      const updated = currentTags.filter((t) => !(t.type === tag.type && t.value === tag.value));
      if (updated.length !== currentTags.length) {
        entries.push([itemId, { ...(original || {}), ...currentEdit, tags: updated } as QuestionItem]);
      }
    });
    if (entries.length) {
      saveManyEdits(entries);
      toast({ title: "Tags removed", description: `Removed from ${entries.length} item(s).` });
      setSelectedItems(new Set());
    }
  };
  const handleBulkArchive = () => {
    if (selectedItems.size === 0) return;
    saveManyEdits(Array.from(selectedItems).map((id) => [id, { archived: true }]));
    setSelectedItems(new Set());
    toast({ title: "Archived", description: `${selectedItems.size} item(s) archived.` });
  };
  const handleBulkRestore = () => {
    if (selectedItems.size === 0) return;
    saveManyEdits(Array.from(selectedItems).map((id) => [id, { archived: false }]));
    setSelectedItems(new Set());
    toast({ title: "Restored", description: `${selectedItems.size} item(s) restored.` });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      saveEdit(itemToDelete.id, { ...getEdit(itemToDelete.id), deleted: true });
      toast({ title: "Deleted", description: "Item permanently deleted." });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };
  const handleDeleteAllArchived = () => setDeleteAllConfirmOpen(true);
  const confirmDeleteAllArchived = () => {
    const archived = sortedAndFilteredItems.filter((i) => getDisplayData(i).archived);
    if (archived.length) {
      saveManyEdits(archived.map((i) => [i.id, { ...getEdit(i.id), deleted: true }]));
      toast({ title: "Deleted", description: `${archived.length} archived item(s) deleted.` });
    }
    setDeleteAllConfirmOpen(false);
  };

  const exportData = async (format: "pdf" | "csv" | "docx") => {
    try {
      toast({ title: "Preparing export...", duration: 2000 });
      const { exportToPDF, exportToCSV, exportToDocx, getExportFilename } = await import("@/utils/exportUtils");
      const exportItems = filteredItems.map((item) => ({
        id: item.id,
        title: item.documentTitle || "Unknown",
        answer: item.answer || "",
        question: item.question || "",
        fileName: item.documentTitle || "Unknown",
        lastEdited: formatFullDate(item.updatedAt),
        lastEditor: item.updatedBy,
        tags: getDisplayData(item).tags,
        strategy: getDisplayData(item).strategy,
        type: item.type,
      }));
      const contextTitle = `Search Results for "${effectiveQuery}"`;
      const filename = getExportFilename(format, `Search_${effectiveQuery}`);
      if (format === "pdf") await exportToPDF(exportItems, contextTitle, filename);
      else if (format === "csv") exportToCSV(exportItems, filename);
      else await exportToDocx(exportItems, contextTitle, filename);
      toast({ title: "Export successful", description: `${format.toUpperCase()} downloaded.`, duration: 3000 });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", variant: "destructive", duration: 3000 });
    }
  };

  const tagTypes = getAllTagTypes();
  const gridTemplateColumns = "auto 3fr 3fr 2fr 1fr auto";

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-sidebar-background flex flex-1 overflow-hidden">
        <VaultSidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-background mt-4 ml-4 rounded-tl-2xl vault-scroll">
          <div className="flex-1 overflow-y-auto">

            {/* Header */}
            <div className="border-b border-foreground/10 bg-background">
              <div className="flex items-center justify-between px-6 py-6 max-w-[100rem] mx-auto">
                <h1 className="text-2xl font-semibold">Search Results</h1>
                
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

            <div ref={searchResultsRef} className="h-full space-y-6">
              <div className="max-w-[100rem] px-6 pt-3 mx-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/vault")}
                  className="flex items-center gap-2 text-foreground/70 hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Q&A Pairs
                </Button>
              </div>

              {/* Search bar, filters, find */}
              <div className="bg-sidebar-background/50 p-6 space-y-3 border-b border-foreground/10">
                <div className="flex items-center gap-3 px-6 max-w-[100rem] mx-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70" />
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Search or filter..."
                      className="pl-10 pr-10 h-12"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          navigate("/search");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70 hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="outline" size="xl" onClick={() => setShowFiltersPanel(true)} className="h-12 px-4 gap-2">
                    <Filter className="h-4 w-4" />
                    Open Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="text-xs">
                        {totalFiltersCount}
                      </Badge>
                    )}
                  </Button>
                  <Button onClick={handleSearch} className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 px-6 h-12 min-w-32">
                    Find
                  </Button>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-foreground/70">Active filters:</span>
                    {Object.entries(selectedTagFilters).flatMap(([name, values]) =>
                      values.map((v) => (
                        <Badge key={`${name}-${v}`} variant="secondary" className="gap-1">
                          {name}: {v}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const next = values.filter((x) => x !== v);
                              setSelectedTagFilters((prev) => (next.length ? { ...prev, [name]: next } : { ...prev, [name]: [] }));
                            }}
                          />
                        </Badge>
                      ))
                    )}
                    <Button variant="link" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between max-w-[100rem] mx-auto px-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {sortedAndFilteredItems.length} {sortedAndFilteredItems.length === 1 ? "Result" : "Results"}
                    {isFileMode && fileName && ` from "${fileName}"`}
                    {effectiveQuery && !isFileMode && ` for "${effectiveQuery}"`}
                  </h2>
                  {hasActiveFilters && <p className="text-foreground/70 mt-1">Filtered by {totalFiltersCount} criteria</p>}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sort: {currentSort === "relevance" ? "Relevance" : currentSort === "lastEdited" ? "Last edited" : "Last editor"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSortChange("relevance")}>
                        {currentSort === "relevance" && <Check className="mr-2 h-4 w-4" />}
                        Relevance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("lastEdited")}>
                        {currentSort === "lastEdited" && <Check className="mr-2 h-4 w-4" />}
                        Last edited
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("lastEditor")}>
                        {currentSort === "lastEditor" && <Check className="mr-2 h-4 w-4" />}
                        Last editor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {state.showArchived && (
                    <Button variant="outline" size="sm" onClick={handleDeleteAllArchived} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Archived
                    </Button>
                  )}
                  <Button
                    variant={state.showArchived ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowArchived(!state.showArchived);
                      const params = new URLSearchParams(searchParams);
                      if (!state.showArchived) params.set("showArchived", "true");
                      else params.delete("showArchived");
                      navigate(`/search?${params.toString()}`, { replace: true });
                    }}
                  >
                    <Archive className="h-4 w-4" />
                    {state.showArchived ? "Hide archived" : "Show archived"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Export Results
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportData("pdf")}>PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportData("csv")}>XLS/CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportData("docx")}>Word (.docx)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Results table or empty */}
              {sortedAndFilteredItems.length === 0 ? (
                <div className="text-center py-12 max-w-[100rem] mx-auto px-6">
                  <p className="text-lg text-foreground/70 mb-4">No results match your search and filters.</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/search")}>
                      Clear search
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-foreground/10 rounded-lg overflow-hidden max-w-[calc(100rem-48px)] mx-auto">
                  <div className="relative">
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
                        type="button"
                        onClick={() => handleColumnSort("question")}
                        className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground text-left"
                      >
                        Question
                        {qaSortColumn === "question" && (qaSortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleColumnSort("answer")}
                        className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground text-left"
                      >
                        Answer
                        {qaSortColumn === "answer" && (qaSortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleColumnSort("document")}
                        className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground text-left"
                      >
                        Document
                        {qaSortColumn === "document" && (qaSortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleColumnSort("lastUpdated")}
                        className="font-medium text-sm px-4 py-3 flex items-center gap-1 hover:text-foreground text-left whitespace-nowrap"
                      >
                        Last Updated
                        {qaSortColumn === "lastUpdated" && (qaSortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                      </button>
                      <div className="font-medium px-4 py-3 text-sm">Actions</div>
                    </div>
                    <div className="divide-y divide-foreground/10">
                      {sortedAndFilteredItems.map((item, index) => {
                        const displayData = getDisplayData(item);
                        const isSelected = selectedItems.has(item.id);
                        const question = displayData.question || "";
                        const answer = displayData.answer || "";
                        const answerPreview = answer.length > 200 ? answer.slice(0, 200) + "..." : answer;
                        const tagsByType = tagTypes.reduce(
                          (acc, tt) => {
                            acc[tt.name] = (displayData.tags || []).filter((t: Tag) => t.type === tt.name);
                            return acc;
                          },
                          {} as Record<string, Tag[]>
                        );
                        const tags = displayData.tags || [];
                        const isEven = index % 2 === 0;
                        return (
                          <React.Fragment key={item.id}>
                            <div
                              className={`group grid items-start ${isSelected ? "bg-itemHoverBackground" : ""} ${
                                displayData.archived ? "opacity-60 bg-muted/20 border-l-2 border-muted" : ""
                              } ${isEven && !isSelected && !displayData.archived ? "bg-sidebar-background" : ""}`}
                              style={{ gridTemplateColumns }}
                            >
                              <div className="flex items-start pr-4 pl-2 py-3">
                                <Checkbox checked={isSelected} onCheckedChange={() => handleItemSelect(item.id)} />
                              </div>
                              <div className="min-w-0 px-4 py-3">
                                <div className="text-sm font-medium text-foreground">{question}</div>
                              </div>
                              <div className="min-w-0 px-4 py-3">
                                <div className="text-sm text-foreground/70 line-clamp-3">{answerPreview}</div>
                                {answer.length > 200 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenQAModal(item, "view");
                                    }}
                                    className="text-xs text-sidebar-primary hover:underline mt-1"
                                  >
                                    Show more
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-foreground/70 break-all flex items-start px-4 py-3">{item.documentTitle || "-"}</div>
                              <div className="text-sm text-foreground/70 flex items-start px-4 py-3">
                                {displayData.updatedAt ? formatRelativeTime(displayData.updatedAt) : "-"}
                              </div>
                              <div className="grid items-start justify-center px-4 py-3 gap-1">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleCopyAnswer(answer)}>
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Copy Answer</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Edit</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleArchive(item.id)}
                                      >
                                        {displayData.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">{displayData.archived ? "Restore" : "Archive"}</TooltipContent>
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
                                    <TooltipContent side="left">View History</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive"
                                        onClick={() => {
                                          setItemToDelete(item);
                                          setDeleteConfirmOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Delete</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`grid items-start border-t border-foreground/5 ${isSelected ? "bg-itemHoverBackground" : ""} ${
                                displayData.archived ? "opacity-60 bg-muted/20" : ""
                              } ${isEven && !isSelected && !displayData.archived ? "bg-sidebar-background" : ""}`}
                              style={{ gridTemplateColumns }}
                            >
                              <div />
                              <div className="col-span-4 px-4 py-2 flex flex-wrap gap-2">
                                {tags.length > 0 ? (
                                  Object.entries(tagsByType).flatMap(([typeName, typeTags]) =>
                                    typeTags.map((t) => (
                                      <Badge key={`${t.type}-${t.value}`} variant="outline" className="text-xs">
                                        {typeName}: {t.value}
                                      </Badge>
                                    ))
                                  )
                                ) : (
                                  <span className="text-xs text-foreground/50">No tags</span>
                                )}
                              </div>
                              <div />
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
        showDocumentNames={true}
      />

      {selectedItems.size > 0 && contentBounds && (
        <div
          className="fixed bottom-4 z-50"
          style={{ left: `${contentBounds.left + 40}px`, width: `${contentBounds.width - 80}px` }}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-t from-sidebar-background/90 to-sidebar-background/80 backdrop-blur-sm border border-sidebar-primary/50 rounded-xl shadow-2xl">
            <span className="text-sm font-medium">
              {selectedItems.size} {selectedItems.size === 1 ? "item" : "items"} selected
            </span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Add Tag <ChevronDown className="ml-2 h-4 w-4" />
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
                            <CommandItem key={value} onSelect={() => handleBulkTagAdd({ type: tagType.name, value })}>
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
                    Remove Tag <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      {(() => {
                        const selectedTagsMap = new Map<string, Set<string>>();
                        selectedItems.forEach((itemId) => {
                          const item = allItems.find((i) => i.id === itemId);
                          if (item) {
                            (getDisplayData(item).tags || []).forEach((t: Tag) => {
                              if (!selectedTagsMap.has(t.type)) selectedTagsMap.set(t.type, new Set());
                              selectedTagsMap.get(t.type)!.add(t.value);
                            });
                          }
                        });
                        return Array.from(selectedTagsMap.entries()).map(([tagType, values]) => (
                          <CommandGroup key={tagType} heading={tagType}>
                            {Array.from(values).map((value) => (
                              <CommandItem key={value} onSelect={() => handleBulkTagRemove({ type: tagType, value })}>
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <ChangeHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        itemId={historyModalItemId || ""}
        currentQuestion={historyModalQuestion}
        currentAnswer={historyModalAnswer}
      />
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

      <FirmUpdatesModal
        open={showFirmUpdatesModal}
        onClose={() => setShowFirmUpdatesModal(false)}
      />
      
      <FindDuplicatesModal
        open={showFindDuplicatesModal}
        onClose={() => setShowFindDuplicatesModal(false)}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete &quot;{itemToDelete?.question}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Archived</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete all archived items in this result set? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAllArchived} className="bg-destructive text-destructive-foreground">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
  );
}
