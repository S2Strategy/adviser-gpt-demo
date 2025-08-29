import { useState } from "react";
import { Bookmark, Trash2, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { formatDistanceToNow } from "date-fns";

interface SavedSearchesProps {
  onLoadSearch: (searchData: { query: string; filters: { strategy?: string; contentType?: string; tags?: string[]; }; }) => void;
  currentQuery: string;
  currentFilters: {
    strategy?: string;
    contentType?: string;
    tags?: string[];
  };
}

export function SavedSearches({ onLoadSearch, currentQuery, currentFilters }: SavedSearchesProps) {
  const { savedSearches, saveSearch, deleteSearch, loadSearch } = useSavedSearches();
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim()) return;
    
    saveSearch(searchName.trim(), currentQuery, {
      strategy: currentFilters.strategy !== "All Strategies" ? currentFilters.strategy : undefined,
      contentType: currentFilters.contentType !== "All Types" ? currentFilters.contentType : undefined,
      tags: currentFilters.tags?.length ? currentFilters.tags : undefined,
    });
    
    setSearchName("");
    setIsOpen(false);
  };

  const handleLoadSearch = (search: SavedSearch) => {
    const loadedSearch = loadSearch(search);
    onLoadSearch(loadedSearch);
  };

  const canSaveCurrentSearch = currentQuery.trim() || 
    (currentFilters.strategy && currentFilters.strategy !== "All Strategies") ||
    (currentFilters.contentType && currentFilters.contentType !== "All Types") ||
    (currentFilters.tags && currentFilters.tags.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved Searches
        </h3>
        {canSaveCurrentSearch && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current Search</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Enter a name for this search..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCurrentSearch();
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Current Search Parameters</Label>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {currentQuery && (
                      <div>Query: "{currentQuery}"</div>
                    )}
                    {currentFilters.strategy && currentFilters.strategy !== "All Strategies" && (
                      <div>Strategy: {currentFilters.strategy}</div>
                    )}
                    {currentFilters.contentType && currentFilters.contentType !== "All Types" && (
                      <div>Content Type: {currentFilters.contentType}</div>
                    )}
                    {currentFilters.tags && currentFilters.tags.length > 0 && (
                      <div>Tags: {currentFilters.tags.join(', ')}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCurrentSearch} disabled={!searchName.trim()}>
                    Save Search
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {savedSearches.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No saved searches yet
        </div>
      ) : (
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-accent/50 transition-colors"
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleLoadSearch(search)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{search.name}</span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2">
                  Saved {formatDistanceToNow(search.createdAt, { addSuffix: true })}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {search.query && (
                    <Badge variant="outline" className="text-xs">
                      "{search.query}"
                    </Badge>
                  )}
                  {search.filters.strategy && (
                    <Badge variant="outline" className="text-xs">
                      {search.filters.strategy}
                    </Badge>
                  )}
                  {search.filters.contentType && (
                    <Badge variant="outline" className="text-xs">
                      {search.filters.contentType}
                    </Badge>
                  )}
                  {search.filters.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteSearch(search.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}