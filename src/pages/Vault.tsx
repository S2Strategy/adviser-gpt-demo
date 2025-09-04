import { useSearchParams } from "react-router-dom";
import { VaultHomepage } from "@/components/VaultHomepage";
import { VaultSearchResults } from "@/components/VaultSearchResults";

export default function Vault() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const fileName = searchParams.get('fileName');
  
  // Check for any filter parameters
  const hasFilters = searchParams.get('strategy') || 
                     searchParams.get('type') || 
                     searchParams.get('tags') || 
                     searchParams.get('status');

  // If there's a search query, file view, or any filters, show search results; otherwise show homepage
  return (query || fileName || hasFilters) ? <VaultSearchResults /> : <VaultHomepage />;
}