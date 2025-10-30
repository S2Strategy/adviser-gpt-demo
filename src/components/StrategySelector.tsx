import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightbulb, Plus, X } from 'lucide-react';

interface StrategySelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
  onCreateOption?: (name: string) => void;
  maxInline?: number;
  size?: 'sm' | 'md';
  triggerLabel?: string;
}

export default function StrategySelector({
  value,
  onChange,
  options,
  onCreateOption,
  maxInline = 2,
  size = 'sm',
  triggerLabel = 'Edit Strategies',
}: StrategySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localOptions, setLocalOptions] = useState<string[]>(options);

  useEffect(() => {
    setLocalOptions((prev) => {
      // merge incoming options without dropping previously created ones
      const set = new Set([...(prev || []), ...options]);
      return Array.from(set);
    });
  }, [options]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const normalizedValue = useMemo(() => value.map((v) => v.trim()).filter(Boolean), [value]);
  const lowerValueSet = useMemo(() => new Set(normalizedValue.map((v) => v.toLowerCase())), [normalizedValue]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (localOptions || []).filter((opt) => !lowerValueSet.has(opt.toLowerCase()));
    if (!q) return base;
    return base.filter((opt) => opt.toLowerCase().includes(q));
  }, [localOptions, lowerValueSet, query]);

  const canAddCustom = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return !lowerValueSet.has(q.toLowerCase());
  }, [query, lowerValueSet]);

  const addStrategy = (s: string, closeAfter: boolean = false) => {
    const next = Array.from(new Set([...normalizedValue, s.trim()])).filter(Boolean);
    onChange(next);
    if (closeAfter) setOpen(false);
  };

  const removeStrategy = (s: string) => {
    const next = normalizedValue.filter((v) => v.toLowerCase() !== s.toLowerCase());
    onChange(next);
  };

  const addCustom = (label: string) => {
    const name = label.trim();
    if (!name) return;
    // update local options for immediate discoverability
    setLocalOptions((prev) => (prev.includes(name) ? prev : [...prev, name]));
    // notify parent if they want to persist
    onCreateOption?.(name);
    addStrategy(name, true);
  };

  const chipClass = size === 'sm' ? 'text-xs h-5' : 'text-sm h-6';
  const triggerSizeClass = size === 'sm' ? 'h-6 px-2' : 'h-7 px-2.5';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Inline chips with icon */}
      {normalizedValue.slice(0, maxInline).map((s) => (
        <Badge key={s} variant="secondary" className={`flex items-center gap-1 ${chipClass}`}>
          <Lightbulb className="h-3 w-3" />
          {s}
          <button
            type="button"
            className="ml-1 inline-flex items-center"
            onClick={() => removeStrategy(s)}
            aria-label={`Remove ${s}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {normalizedValue.length > maxInline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs ${size === 'sm' ? 'h-5' : 'h-6'}`}>
              +{normalizedValue.length - maxInline}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{normalizedValue.slice(maxInline).join(', ')}</TooltipContent>
        </Tooltip>
      )}

      {/* Trigger + Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={triggerSizeClass}>
            <Plus className="h-3 w-3" /> {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <div className="flex flex-wrap gap-1">
              {normalizedValue.length === 0 && (
                <span className="text-xs text-foreground/60">No strategies selected</span>
              )}
              {normalizedValue.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {s}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center"
                    onClick={() => removeStrategy(s)}
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Search or add strategy..." />
            <CommandList>
              {filteredOptions.length === 0 && !canAddCustom && <CommandEmpty>No strategies found</CommandEmpty>}
              <CommandGroup heading="Suggestions">
                {filteredOptions.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => addStrategy(opt, true)}
                  >
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
              {canAddCustom && (
                <CommandGroup heading="Add new">
                  <CommandItem value={query} onSelect={() => addCustom(query)}>
                    <Plus className="h-3 w-3 mr-2" /> Add “{query.trim()}”
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}


