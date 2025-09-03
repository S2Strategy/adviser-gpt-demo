import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VaultSidebar } from "./VaultSidebar";
import { 
  Search, 
  ChevronDown, 
  MoreHorizontal, 
  FileText, 
  ArrowUpDown,
  Copy,
  Building2,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVaultState } from "@/hooks/useVaultState";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";
import { STRATEGIES, CONTENT_TYPES, STATUS_OPTIONS } from "@/types/vault";

export function VaultHomepage() {
  const navigate = useNavigate();
  const { state, setQuery, setFilters, setActiveView } = useVaultState();
  const [searchInput, setSearchInput] = useState(state.query);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");  
  const [selectedTags, setSelectedTags] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<"name" | "totalItems">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSearch = () => {
    if (searchInput.trim()) {
      setQuery(searchInput);
      setFilters({
        strategy: selectedStrategy || undefined,
        contentType: selectedType || undefined,
        tags: selectedTags ? [selectedTags] : undefined,
        status: selectedStatus || undefined
      });
      
      const params = new URLSearchParams();
      params.set('query', searchInput);
      if (selectedStrategy) params.set('strategy', selectedStrategy);
      if (selectedType) params.set('type', selectedType);
      if (selectedTags) params.set('tags', selectedTags);
      if (selectedStatus) params.set('status', selectedStatus);
      
      navigate(`/vault/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Group items by file for Files view
  const fileGroups = MOCK_CONTENT_ITEMS.reduce((acc, item) => {
    if (!acc[item.title]) {
      acc[item.title] = {
        name: item.title,
        totalItems: item.totalItems || 1,
        type: item.type,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedFiles = Object.values(fileGroups).sort((a, b) => {
    if (sortColumn === "name") {
      return sortDirection === "asc" ? 
        a.name.localeCompare(b.name) : 
        b.name.localeCompare(a.name);
    } else {
      return sortDirection === "asc" ? 
        a.totalItems - b.totalItems : 
        b.totalItems - a.totalItems;
    }
  });

  const toggleSort = (column: "name" | "totalItems") => {
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
    totalItems: MOCK_CONTENT_ITEMS.filter(item => item.type === type).length
  }));

  // Group by strategy for Strategy view
  const strategyGroups = STRATEGIES.map(strategy => ({
    name: strategy,
    totalItems: MOCK_CONTENT_ITEMS.filter(item => item.strategy === strategy).length
  })).filter(group => group.totalItems > 0);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-semibold">Vault</h1>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Find duplicates
            </Button>
            <Button variant="outline" size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Edit firm details
            </Button>
            <Button size="sm" className="bg-black text-white hover:bg-black/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload new
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search or filter my Vault..."
                className="pl-10 h-10"
              />
            </div>
            
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map(strategy => (
                  <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Types" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTags} onValueChange={setSelectedTags}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="ESG">ESG</SelectItem>
                <SelectItem value="RFP">RFP</SelectItem>
                <SelectItem value="Policy">Policy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSearch}
              className="bg-black text-white hover:bg-black/90 px-6"
            >
              Find
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs value={state.activeView} onValueChange={(value) => setActiveView(value as any)}>
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Manage</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Updates 160
              </Badge>
              <Badge variant="outline">Tags</Badge>
            </div>
          </div>

          {/* Files View */}
          <TabsContent value="files">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => toggleSort("name")}
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold"
                        onClick={() => toggleSort("totalItems")}
                      >
                        Total Items
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiles.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {file.totalItems}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Export</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Type View */}
          <TabsContent value="type">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {typeGroups.map((group) => (
                <div key={group.name} className="border rounded-lg p-4 text-center">
                  <h3 className="font-semibold mb-2">{group.name}</h3>
                  <p className="text-2xl font-bold text-muted-foreground">{group.totalItems}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Strategy View */}
          <TabsContent value="strategy">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategyGroups.map((group) => (
                <div key={group.name} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{group.name}</h3>
                  <p className="text-xl font-bold text-muted-foreground">{group.totalItems}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Data View */}
          <TabsContent value="data">
            <div className="space-y-4">
              {MOCK_CONTENT_ITEMS
                .filter(item => item.type === "Quantitative")
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Updated by {item.updatedBy} • {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              {MOCK_CONTENT_ITEMS.filter(item => item.type === "Quantitative").length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No quantitative data items found.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}