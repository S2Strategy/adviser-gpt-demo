import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Star, 
  CornerDownRight, 
  Lightbulb, 
  X, 
  Edit, 
  Archive, 
  Mail, 
  ChevronDown, 
  ChevronRight,
  Copy,
  CopyCheck, 
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QuestionItem, Tag } from '@/types/vault';
import { useTagTypes } from '@/hooks/useTagTypes';
import { migrateQuestionItem } from '@/utils/tagMigration';

interface QuestionCardProps {
  item: QuestionItem & { documentTitle?: string; documentId?: string };
  query?: string;
  fileName?: string;
  hasEdits?: boolean;
  isExpanded?: boolean;
  showBestAnswerTag?: boolean;
  isNested?: boolean; // Whether this is a nested child question
  onToggleExpansion?: (itemId: string) => void;
  onEdit?: (item: QuestionItem) => void;
  onCopyAnswer?: (answer: string) => void;
  onTagRemove?: (itemId: string, tag: Tag) => void;
  onTagAdd?: (itemId: string, tag: Tag) => void;
  onArchive?: (itemId: string) => void;
  highlightSearchTerms?: (text: string, query: string) => string;
  formatRelativeTime?: (isoString: string) => string;
  formatFullDate?: (isoString: string) => string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  item,
  query = '',
  fileName,
  hasEdits = false,
  isExpanded = false,
  showBestAnswerTag = true,
  isNested = false,
  onToggleExpansion,
  onEdit,
  onCopyAnswer,
  onTagRemove,
  onTagAdd,
  onArchive,
  highlightSearchTerms = (text) => text,
  formatRelativeTime = (date) => date,
  formatFullDate = (date) => date,
}) => {
  const { getAllTagTypes, getTagTypeValues, addTagTypeValue } = useTagTypes();
  const tagTypes = getAllTagTypes();
  const [addingTagToItem, setAddingTagToItem] = useState<{ itemId: string; tagTypeName: string } | null>(null);
  const [newTagValue, setNewTagValue] = useState('');
  const [selectedTagType, setSelectedTagType] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  
  // Migrate item to new format
  const migratedItem = migrateQuestionItem(item);

  // Reset copy state after 3 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const getDisplayData = (item: QuestionItem) => {
    const migrated = migrateQuestionItem(item);
    return {
      question: item.question || '',
      answer: item.answer || '',
      tags: migrated.tags || [],
      isBestAnswer: item.isBestAnswer || false,
      archived: item.archived || false,
    };
  };

  const displayData = getDisplayData(item);
  
  // Group tags by type
  const tagsByType = tagTypes.reduce((acc, tagType) => {
    acc[tagType.name] = displayData.tags.filter((tag: Tag) => tag.type === tagType.name);
    return acc;
  }, {} as Record<string, Tag[]>);
  const answer = displayData.answer || '';

  const handleCopyAnswer = () => {
    if (onCopyAnswer) {
      onCopyAnswer(answer);
      setIsCopied(true);
    }
  };
  const shouldTruncate = answer.length > 300;
  const displayAnswer = isExpanded ? answer : answer.substring(0, 300);

  const handleNewTagSave = (itemId: string, tagTypeName: string) => {
    if (newTagValue.trim() && onTagAdd) {
      const availableValues = getTagTypeValues(tagTypeName);
      const trimmedValue = newTagValue.trim();
      
      // Auto-add value to allowed list if it's not present
      if (!availableValues.includes(trimmedValue)) {
        addTagTypeValue(tagTypeName, trimmedValue);
      }
      
      // Add the tag to the item
      onTagAdd(itemId, { type: tagTypeName, value: trimmedValue });
      setNewTagValue("");
      setAddingTagToItem(null);
      setSelectedTagType("");
    }
  };

  const handleNewTagCancel = () => {
    setNewTagValue("");
    setAddingTagToItem(null);
    setSelectedTagType("");
    setTagSearchQuery("");
    setTagSearchOpen(false);
  };
  
  // Reset search when closing or changing tag type
  useEffect(() => {
    if (!addingTagToItem) {
      setTagSearchQuery("");
      setTagSearchOpen(false);
    }
  }, [addingTagToItem]);

  // Determine if this is a parent question with children
  const hasChildren = item.children && item.children.length > 0;
  const isParentExpanded = item.isExpanded !== false; // Default to expanded

  return (
    <div className={`border border-foreground/20 rounded-lg vault-result-card ${
      isNested 
        ? 'bg-background border-foreground/10 ml-6' 
        : 'bg-background'
    }`}>
      {/* Header with file info and badge */}
      <div className="flex items-start justify-between pb-4 border-b border-foreground/20 px-6 py-4">
        <div className="flex items-center min-w-0 gap-3 flex-1">
          {/* Expand/Collapse button for parent questions */}
          {hasChildren && onToggleExpansion && (
            <button
              onClick={() => onToggleExpansion(item.id)}
              className="flex items-center justify-center w-7 h-7 hover:bg-sidebar-background rounded transition-colors"
            >
              {isParentExpanded ? (
                <ChevronDown className="h-4 w-4 text-foreground/70" />
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground/70" />
              )}
            </button>
          )}
          {!fileName && (
            <FileText className="h-4 w-4 flex-shrink-0 text-foreground/60" />
          )}
          {!fileName && (
            <div 
              className="font-bold break-words min-w-0 text-sm"
              style={{ 
                wordBreak: 'break-word',
                hyphens: 'auto',
                lineHeight: '1.4' 
              }}
            >
              {item.documentTitle || 'Unknown Document'}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm" style={{ lineHeight: '1.4' }}>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-4 w-4 text-foreground/60" />
              <span className="text-foreground/60">Last edited</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-grid border border-t-0 border-x-0 border-b-1 border-dashed border-foreground/30 cursor-help text-foreground">
                    {formatRelativeTime(item.updatedAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                    {formatFullDate(item.updatedAt)}
                </TooltipContent>
              </Tooltip>
              
              <span className="text-foreground/60">by</span>
              <span className="text-foreground">{item.updatedBy}</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              {/* Additional info can go here */}
            </div>
            {hasEdits && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                Edited
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {displayData.isBestAnswer && showBestAnswerTag && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full accent text-accent-foreground">
              <Star className="h-3 w-3" />
              <span className="text-xs font-semibold">Best Answer</span>
            </div>
          )}
          {displayData.archived && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background text-foreground">
              <Archive className="h-3 w-3" />
              <span className="text-xs font-semibold">Archived</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer Section */}
      {displayData.answer && (
        <div className="space-y-2 px-6 py-4">
          <h4 className="text-xs font-bold leading-5 tracking-tight">Answer</h4>
          <div className="bg-foreground/5 rounded-md p-4">
            <p 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: highlightSearchTerms(displayAnswer, query) + (shouldTruncate && !isExpanded ? '...' : '')
              }}
            />
            {shouldTruncate && onToggleExpansion && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto"
                onClick={() => onToggleExpansion(item.id)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Question Section */}
      {displayData.question && (
        <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
          <div className="flex items-start gap-2">
            <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0 text-foreground/60" />
            <div className="space-y-2">
              <h4 className="text-xs font-bold leading-5 tracking-tight">Question</h4>
              <p
                className="text-base font-bold leading-6 tracking-tight"
                dangerouslySetInnerHTML={{ __html: highlightSearchTerms(displayData.question, query) }}
              />
             
              {/* Tags in Question Section - Grouped by type, each type on separate row */}
              <div className="space-y-2 mt-3">
                {tagTypes.map((tagType) => {
                  const tagsOfType = tagsByType[tagType.name] || [];
                  const isAdding = addingTagToItem?.itemId === item.id && addingTagToItem?.tagTypeName === tagType.name;
                  
                  return (
                    <div key={tagType.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground/70">{tagType.name}:</span>
                      {tagsOfType.map((tag: Tag) => (
                        <Badge 
                          key={`${tag.type}-${tag.value}`} 
                          variant="outline" 
                          className="text-xs vault-tag flex items-center gap-1"
                        >
                          {tag.value}
                          {onTagRemove && (
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-sidebar-accent" 
                              onClick={() => onTagRemove(item.id, tag)}
                            />
                          )}
                        </Badge>
                      ))}
                      {isAdding ? (
                        <div className="flex items-center gap-1">
                          <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs w-32 justify-between"
                                onClick={() => setTagSearchOpen(true)}
                              >
                                <span className="truncate">
                                  {newTagValue || `Select ${tagType.name.toLowerCase()}...`}
                                </span>
                                <ChevronDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[200px]" align="start">
                              <Command>
                                <CommandInput
                                  placeholder={`Search ${tagType.name.toLowerCase()}...`}
                                  value={tagSearchQuery}
                                  onValueChange={setTagSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>No {tagType.name.toLowerCase()} found.</CommandEmpty>
                                  <CommandGroup>
                                    {getTagTypeValues(tagType.name)
                                      .filter(value => {
                                        // Filter out already selected tags
                                        const notSelected = !tagsOfType.some((t: Tag) => t.value === value);
                                        // Filter by search query
                                        const matchesSearch = !tagSearchQuery || 
                                          value.toLowerCase().includes(tagSearchQuery.toLowerCase());
                                        return notSelected && matchesSearch;
                                      })
                                      .map(value => (
                                        <CommandItem
                                          key={value}
                                          value={value}
                                          onSelect={() => {
                                            setNewTagValue(value);
                                            setTagSearchOpen(false);
                                            setTagSearchQuery("");
                                          }}
                                        >
                                          {value}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <button 
                            className="h-6 w-6 flex items-center justify-center border border-sidebar-primary bg-background hover:bg-sidebar-primary rounded text-sidebar-primary hover:text-sidebar-primary-foreground hover:border-sidebar-primary/70 transition-colors" 
                            onClick={() => handleNewTagSave(item.id, tagType.name)}
                            disabled={!newTagValue.trim()}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button 
                            className="h-6 w-6 flex items-center justify-center border border-sidebar-accent bg-background hover:bg-sidebar-accent rounded text-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-accent/70 transition-colors" 
                            onClick={handleNewTagCancel}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : onTagAdd ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs text-foreground vault-tag cursor-pointer hover:bg-sidebar-background"
                          onClick={() => {
                            setAddingTagToItem({ itemId: item.id, tagTypeName: tagType.name });
                            setSelectedTagType(tagType.name);
                            setTagSearchOpen(true);
                            setTagSearchQuery("");
                          }}
                        >
                          + Add {tagType.name}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="border-t border-foreground/20 px-6 py-3 flex items-center justify-end gap-2 rounded-b-lg bg-sidebar-background">
        {onEdit && (
          <button 
            className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium hover:bg-sidebar-background/5 transition active:scale-[0.96]"
            style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        )}
        <button
          className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium hover:bg-sidebar-background/5 transition active:scale-[0.96]"
          style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
          onClick={() => onArchive && onArchive(item.id)}
        >
          <Archive className="h-4 w-4" />
          {displayData.archived ? 'Restore' : 'Archive'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium hover:bg-sidebar-background/5 transition active:scale-[0.96]" style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}>
              <Mail className="h-4 w-4" />
              Email
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Open in Gmail</DropdownMenuItem>
            <DropdownMenuItem>Open in Mail</DropdownMenuItem>
            <DropdownMenuItem>Open in Outlook</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onCopyAnswer && (
          <button 
            className="flex h-8 px-2 pl-3 min-w-24 justify-center items-center gap-2 rounded-md text-sm font-medium bg-sidebar-primary hover:bg-sidebar-primary/80 border-sidebar-primary text-sidebar-primary-foreground transition active:scale-[0.96]"
            style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
            onClick={handleCopyAnswer}
          >
            {isCopied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Render child questions if expanded */}
      {hasChildren && isParentExpanded && (
        <div className="border-t py-8 pb-4 mt-[-3.5rem] pr-6 space-y-2 border-l-2 border-foreground/40 border-t-0 bg-sidebar-background">
          <h4 className="text-xs font-bold line-height-1-5 tracking-tight pl-6">Sub Questions</h4>
          {item.children?.map((child) => (
            <QuestionCard
              key={child.id}
              item={child}
              query={query}
              fileName={fileName}
              hasEdits={hasEdits}
              isExpanded={isExpanded}
              showBestAnswerTag={showBestAnswerTag}
              isNested={true}
              onToggleExpansion={onToggleExpansion}
              onEdit={onEdit}
              onCopyAnswer={onCopyAnswer}
              onTagRemove={onTagRemove}
              onTagAdd={onTagAdd}
              onArchive={onArchive}
              highlightSearchTerms={highlightSearchTerms}
              formatRelativeTime={formatRelativeTime}
              formatFullDate={formatFullDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};