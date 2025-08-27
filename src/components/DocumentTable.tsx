import { useState } from "react";
import { File, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentTableProps {
  data: Array<{
    name: string;
    totalItems: number;
  }>;
}

type SortField = "name" | "totalItems";
type SortDirection = "asc" | "desc";

export function DocumentTable({ data }: DocumentTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? comparison : -comparison;
    } else {
      const comparison = a.totalItems - b.totalItems;
      return sortDirection === "asc" ? comparison : -comparison;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="bg-vault-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          onClick={() => handleSort("name")}
          className="flex items-center gap-2 font-medium text-left justify-start p-0 h-auto"
        >
          Name
          <SortIcon field="name" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleSort("totalItems")}
          className="flex items-center gap-2 font-medium"
        >
          Total Items
          <SortIcon field="totalItems" />
        </Button>
      </div>

      {/* Content */}
      <div className="divide-y">
        {sortedData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 hover:bg-vault-card-hover transition-colors group"
          >
            <div className="flex items-center gap-3">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{item.totalItems}</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}