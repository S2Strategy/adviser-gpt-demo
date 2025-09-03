import { useSearchParams } from "react-router-dom";
import { VaultHomepage } from "@/components/VaultHomepage";
import { VaultSearchResults } from "@/components/VaultSearchResults";

export default function Vault() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const fileName = searchParams.get('fileName');

  // If there's a search query or file view, show search results; otherwise show homepage
  return (query || fileName) ? <VaultSearchResults /> : <VaultHomepage />;
}