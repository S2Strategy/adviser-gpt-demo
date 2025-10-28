import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  width?: string;
  size?: "default" | "sm" | "lg" | "icon" | "xs" | "xl";
}

export function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  width = "w-auto",
  size = "default"
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleOption = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(item => item !== option)
      : [...selectedValues, option];
    
    onSelectionChange(newSelection);
  };

  const displayText = selectedValues.length === 0 
    ? (placeholder || title)
    : title;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          role="combobox"
          aria-expanded={isOpen}
          className={cn("justify-between", width)}
        >
          <div className="flex items-center gap-2">
            <span className="truncate">{displayText}</span>
            <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full transition-all ease-bounce ${
              selectedValues.length > 0 ? 'opacity-100 duration-180 scale-100' : 'opacity-0 duration-0 scale-50'
            }`}>
              {selectedValues.length}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-popover border z-50 min-w-max max-w-[300px]" align="start">
        <div className="flex flex-col">
          {/* Search bar */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground/70" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-foreground/70">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-foreground/10 cursor-pointer"
                  onClick={() => handleToggleOption(option)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggleOption(option)}
                  />
                  <label className="text-sm font-normal cursor-pointer flex-1">
                    {option}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Clear all button */}
          {selectedValues.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSelectionChange([]);
                  setSearchQuery("");
                }}
                className="h-7 w-full text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}