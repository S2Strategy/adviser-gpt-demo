import React from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Archive } from 'lucide-react';

export type SortColumn = "name" | "totalItems" | "lastEdited" | "lastEditor" | "question" | "lastModified";
export type SortDirection = "asc" | "desc";

interface SortAndArchiveControlsProps {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSortChange: (column: SortColumn) => void;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  sortOptions: {
    value: SortColumn;
    label: string;
  }[];
  title: string;
}

export const SortAndArchiveControls: React.FC<SortAndArchiveControlsProps> = ({
  sortColumn,
  sortDirection,
  onSortChange,
  showArchived,
  onShowArchivedChange,
  sortOptions,
  title,
}) => {
  // Helper function to get the appropriate sort icon
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Helper function to get the sort label
  const getSortLabel = (column: SortColumn) => {
    const option = sortOptions.find(opt => opt.value === column);
    return option?.label || "Name";
  };

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Sort by: {getSortLabel(sortColumn)}
              {getSortIcon(sortColumn)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)}>
                <div className="flex items-center gap-2">
                  {option.label}
                  {sortColumn === option.value && getSortIcon(option.value)}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => onShowArchivedChange(!showArchived)}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" />
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>
    </div>
  );
};
