import { useSearchParams, useLocation } from "react-router-dom";
import { VaultHomepage } from "@/components/VaultHomepage";
import { VaultSearchResults } from "@/components/VaultSearchResults";

export default function Vault() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get('query');
  const fileName = searchParams.get('fileName');
  
  // Check for any filter parameters
  const hasFilters = searchParams.get('strategy') || 
                     searchParams.get('type') || 
                     searchParams.get('tags') || 
                     searchParams.get('status');

  // Always show search results for /vault/search and /vault/file routes
  // Only show homepage for exact /vault route without search context
  const isSearchRoute = location.pathname === '/vault/search';
  const isFileRoute = location.pathname === '/vault/file';
  const shouldShowSearchResults = isSearchRoute || isFileRoute || query || fileName || hasFilters;

  // Create a key that changes when URL parameters change to force re-render
  const searchKey = searchParams.toString();
  
  return shouldShowSearchResults ? <VaultSearchResults key={searchKey} /> : <VaultHomepage />;
}