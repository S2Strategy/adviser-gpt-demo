import { useState, useRef, useEffect } from "react";
import { Search, Clock, X, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useDebounce } from "@/hooks/useDebounce";
import { QuestionCardData } from "./QuestionCard";

interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  contentItems: QuestionCardData[];
  className?: string;
}

export function EnhancedSearchBar({ 
  value, 
  onChange, 
  onSearch, 
  contentItems,
  className 
}: EnhancedSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();
  const debouncedValue = useDebounce(value, 150);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate autocomplete suggestions
  const suggestions = contentItems.reduce<string[]>((acc, item) => {
    // Add tags
    item.tags.forEach(tag => {
      if (tag.toLowerCase().includes(debouncedValue.toLowerCase()) && !acc.includes(tag)) {
        acc.push(tag);
      }
    });
    
    // Add question keywords (first few words)
    if (debouncedValue.length > 2) {
      const words = item.question.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.includes(debouncedValue.toLowerCase()) && word.length > 3 && !acc.includes(word)) {
          acc.push(word);
        }
      });
    }
    
    return acc;
  }, []).slice(0, 5);

  const allSuggestions = [
    ...history.filter(h => h.toLowerCase().includes(debouncedValue.toLowerCase())),
    ...suggestions.filter(s => !history.includes(s))
  ].slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allSuggestions.length) {
          const selectedValue = allSuggestions[focusedIndex];
          onChange(selectedValue);
          addToHistory(selectedValue);
          setIsOpen(false);
          onSearch?.(selectedValue);
        } else if (value.trim()) {
          addToHistory(value);
          setIsOpen(false);
          onSearch?.(value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    addToHistory(suggestion);
    setIsOpen(false);
    onSearch?.(suggestion);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search questions, answers, tags... Try: 'ESG risk' or 'policy:AI'"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (debouncedValue.length > 0 || history.length > 0) && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {allSuggestions.length > 0 ? (
            <div className="py-2">
              {allSuggestions.map((suggestion, index) => {
                const isHistory = history.includes(suggestion);
                return (
                  <div
                    key={suggestion}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                      focusedIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      {isHistory ? (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{suggestion}</span>
                      {isHistory && (
                        <Badge variant="outline" className="text-xs">Recent</Badge>
                      )}
                    </div>
                    {isHistory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(suggestion);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  );
}