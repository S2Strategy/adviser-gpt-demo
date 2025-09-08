import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSavedSearches } from "@/contexts/SavedSearchesContext";
import { useToast } from "@/hooks/use-toast";

interface SaveSearchPromptProps {
  query: string;
  filters: {
    strategies: string[];
    types: string[];
    tags: string[];
    statuses: string[];
  };
  sort?: string;
  onSave?: () => void;
}

export function SaveSearchPrompt({ query, filters, sort, onSave }: SaveSearchPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { saveSearch } = useSavedSearches();
  const { toast } = useToast();

  // Generate a default name based on the search
  const generateDefaultName = () => {
    if (query.trim()) {
      return query.length > 30 ? `${query.substring(0, 30)}...` : query;
    }
    
    const filterParts = [];
    if (filters.strategies.length > 0) filterParts.push(filters.strategies[0]);
    if (filters.types.length > 0) filterParts.push(filters.types[0]);
    if (filters.tags.length > 0) filterParts.push(filters.tags[0]);
    
    if (filterParts.length > 0) {
      return filterParts.join(" + ");
    }
    
    return "Custom Search";
  };

  // Show the prompt if there's an active search
  useEffect(() => {
    const hasActiveSearch = query.trim() || 
      filters.strategies.length > 0 || 
      filters.types.length > 0 || 
      filters.tags.length > 0 || 
      filters.statuses.length > 0;

    if (hasActiveSearch) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [query, filters]);

  const handleSave = () => {
    const finalName = searchName.trim() || generateDefaultName();
    
    saveSearch(finalName, query, filters, sort);
    
    toast({
      title: "Search saved!",
      description: `"${finalName}" has been saved to your saved searches.`,
    });

    setSearchName("");
    setIsDialogOpen(false);
    setIsVisible(false);
    onSave?.();
  };

  if (!isVisible) return null;

  return (  
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Search name</label>
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={generateDefaultName()}
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              onFocus={() => {
                if (!searchName) {
                  setSearchName(generateDefaultName());
                }
              }}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">This search includes:</p>
            <ul className="space-y-1">
              {query && <li>• Query: "{query}"</li>}
              {filters.strategies.length > 0 && (
                <li>• Strategies: {filters.strategies.join(", ")}</li>
              )}
              {filters.types.length > 0 && (
                <li>• Types: {filters.types.join(", ")}</li>
              )}
              {filters.tags.length > 0 && (
                <li>• Tags: {filters.tags.join(", ")}</li>
              )}
              {filters.statuses.length > 0 && (
                <li>• Statuses: {filters.statuses.join(", ")}</li>
              )}
              {sort && sort !== 'relevance' && (
                <li>• Sort: {sort}</li>
              )}
            </ul>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
