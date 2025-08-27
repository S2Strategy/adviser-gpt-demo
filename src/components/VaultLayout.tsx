import { useState } from "react";
import { Search, Filter, Upload, FileText, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VaultTabs } from "./VaultTabs";
import { SearchResults } from "./SearchResults";

export function VaultLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleBackToFiles = () => {
    setShowSearchResults(false);
    // Keep the search query in the input
  };

  if (showSearchResults) {
    return (
      <SearchResults 
        searchQuery={searchQuery}
        onBackToFiles={handleBackToFiles}
        strategy={selectedStrategy}
        types={selectedTypes}
        tags={selectedTags}
        status={selectedStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-vault-header border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-vault-header-foreground">Vault</h1>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Find duplicates
            </Button>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit firm details
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload new
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or filter my Vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="large-cap">Large Cap Growth</SelectItem>
              <SelectItem value="firm-wide">Firm Wide</SelectItem>
              <SelectItem value="small-cap">Small Cap Growth</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTypes} onValueChange={setSelectedTypes}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commentary">Commentary</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="questionnaire">Questionnaire</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTags} onValueChange={setSelectedTags}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="stale">Stale</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch}>Find</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <VaultTabs />
      </main>
    </div>
  );
}
