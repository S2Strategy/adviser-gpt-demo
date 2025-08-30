import { X, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagCloud } from "./TagCloud";
import { QuestionCardData } from "./QuestionCard";

interface FilterBarProps {
  selectedStrategy: string;
  setSelectedStrategy: (strategy: string) => void;
  selectedContentType: string;
  setSelectedContentType: (type: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  contentItems: QuestionCardData[];
  onClearAll: () => void;
  activeFilters: { type: string; value: string; }[];
  showTagCloud?: boolean;
  onToggleTagCloud?: () => void;
}

const strategies = [
  "All Strategies",
  "Firm Wide (Not Strategy Specific)",
  "Large Cap Growth", 
  "Small Cap Growth"
];

const contentTypes = [
  "All Types",
  "RFP",
  "DDQ", 
  "Policy",
  "Commentary"
];

const sortOptions = [
  { label: "Last Updated", value: "lastUpdated" },
  { label: "Expiration Date", value: "expirationDate" },
  { label: "Relevance", value: "relevance" }
];

export function FilterBar({
  selectedStrategy,
  setSelectedStrategy,
  selectedContentType,
  setSelectedContentType,
  sortBy,
  setSortBy,
  selectedTags,
  onTagClick,
  contentItems,
  onClearAll,
  activeFilters,
  showTagCloud = false,
  onToggleTagCloud
}: FilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Modern Pill Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
          <SelectTrigger className="filter-pill w-48 border-primary/20">
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50 rounded-xl">
            {strategies.map(strategy => (
              <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
          <SelectTrigger className="filter-pill w-36 border-primary/20">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50 rounded-xl">
            {contentTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="filter-pill w-36 border-primary/20">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50 rounded-xl">
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onToggleTagCloud && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleTagCloud}
            className={`filter-pill transition-all duration-200 ${
              showTagCloud 
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                : "hover:bg-primary/5 hover:border-primary/30"
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tags
          </Button>
        )}

        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
            className="filter-pill text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {filter.type === 'search' && 'Search:'} 
              {filter.type === 'strategy' && 'Strategy:'} 
              {filter.type === 'contentType' && 'Type:'} 
              {filter.type === 'tags' && 'Tags:'} 
              {filter.value}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Cloud */}
      {showTagCloud && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <TagCloud
            contentItems={contentItems}
            onTagClick={onTagClick}
            selectedTags={selectedTags}
          />
        </div>
      )}
    </div>
  );
}