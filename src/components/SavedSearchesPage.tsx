import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bookmark, 
  Copy, 
  Trash2, 
  Search, 
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSavedSearches } from "@/contexts/SavedSearchesContext";
import { useToast } from "@/hooks/use-toast";
import { VaultSidebar } from "./VaultSidebar";
import { Link } from "react-router-dom";

export function SavedSearchesPage() {
  const navigate = useNavigate();
  const { savedSearches, deleteSearch } = useSavedSearches();
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSearchDescription = (search: any) => {
    const parts = [];
    
    if (search.query) {
      parts.push(`"${search.query}"`);
    }
    
    if (search.filters.strategies?.length > 0) {
      parts.push(`Strategies: ${search.filters.strategies.join(", ")}`);
    }
    
    if (search.filters.types?.length > 0) {
      parts.push(`Types: ${search.filters.types.join(", ")}`);
    }
    
    if (search.filters.tags?.length > 0) {
      parts.push(`Tags: ${search.filters.tags.join(", ")}`);
    }
    
    if (search.filters.statuses?.length > 0) {
      parts.push(`Statuses: ${search.filters.statuses.join(", ")}`);
    }
    
    if (search.sort && search.sort !== 'relevance') {
      parts.push(`Sort: ${search.sort}`);
    }
    
    return parts.length > 0 ? parts.join(" • ") : "No filters applied";
  };

  const generateSearchUrl = (search: any) => {
    const params = new URLSearchParams();
    
    if (search.query) params.set('query', search.query);
    if (search.filters.strategies?.length > 0) params.set('strategy', search.filters.strategies.join(','));
    if (search.filters.types?.length > 0) params.set('type', search.filters.types.join(','));
    if (search.filters.tags?.length > 0) params.set('tags', search.filters.tags.join(','));
    if (search.filters.statuses?.length > 0) params.set('status', search.filters.statuses.join(','));
    if (search.sort && search.sort !== 'relevance') params.set('sort', search.sort);
    
    const queryString = params.toString();
    return queryString ? `/vault/search?${queryString}` : '/vault/search';
  };

  const handleRunSearch = (search: any) => {
    const url = generateSearchUrl(search);
    navigate(url);
  };

  const handleCopyLink = async (search: any) => {
    const url = generateSearchUrl(search);
    const fullUrl = `${window.location.origin}${url}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link copied!",
        description: "The search link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSearch = (id: string, name: string) => {
    deleteSearch(id);
    toast({
      title: "Search deleted",
      description: `"${name}" has been removed from your saved searches.`,
    });
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
              <span className="text-foreground font-medium">
                Saved Searches
              </span>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                Saved Searches
              </h1>
              <p className="text-muted-foreground mt-1">
                {savedSearches.length} saved search{savedSearches.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {savedSearches.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No saved searches yet
              </h3>
              <p className="text-muted-foreground mb-6">
                When you perform searches in the vault, you'll see a prompt to save them for later use.
              </p>
              <Button onClick={() => navigate('/vault')}>
                Go to Vault
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedSearches.map((search) => (
                <Card key={search.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-blue-600" />
                          {search.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatSearchDescription(search)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunSearch(search)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Run Search
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(search)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete saved search</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{search.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSearch(search.id, search.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Saved {formatDate(search.createdAt)}
                      </div>
                      
                      {search.query && (
                        <div className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          Query: "{search.query}"
                        </div>
                      )}
                      
                      {(search.filters.strategies?.length > 0 || 
                        search.filters.types?.length > 0 || 
                        search.filters.tags?.length > 0 || 
                        search.filters.statuses?.length > 0) && (
                        <div className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          {[
                            ...(search.filters.strategies || []),
                            ...(search.filters.types || []),
                            ...(search.filters.tags || []),
                            ...(search.filters.statuses || [])
                          ].length} filter{[
                            ...(search.filters.strategies || []),
                            ...(search.filters.types || []),
                            ...(search.filters.tags || []),
                            ...(search.filters.statuses || [])
                          ].length !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {search.sort && search.sort !== 'relevance' && (
                        <div className="flex items-center gap-1">
                          <ArrowUpDown className="h-3 w-3" />
                          Sorted by {search.sort}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
