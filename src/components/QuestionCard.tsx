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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QuestionItem, STRATEGIES } from '@/types/vault';

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
  onStrategyRemove?: (itemId: string, strategy: string) => void;
  onStrategyAdd?: (itemId: string, strategy: string) => void;
  onTagRemove?: (itemId: string, tag: string) => void;
  onTagAdd?: (itemId: string, tag: string) => void;
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
  onStrategyRemove,
  onStrategyAdd,
  onTagRemove,
  onTagAdd,
  onArchive,
  highlightSearchTerms = (text) => text,
  formatRelativeTime = (date) => date,
  formatFullDate = (date) => date,
}) => {
  const [addingStrategyToItem, setAddingStrategyToItem] = useState<string | null>(null);
  const [newStrategyValue, setNewStrategyValue] = useState('');
  const [addingTagToItem, setAddingTagToItem] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Reset copy state after 3 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const normalizeStrategies = (strategy: string | string[]) => {
    return Array.isArray(strategy) ? strategy : [strategy];
  };

  const getDisplayData = (item: QuestionItem) => ({
    question: item.question || '',
    answer: item.answer || '',
    strategy: item.strategy || [],
    tags: item.tags || [],
    isBestAnswer: item.isBestAnswer || false,
    archived: item.archived || false,
  });

  const displayData = getDisplayData(item);
  const answer = displayData.answer || '';

  const handleCopyAnswer = () => {
    if (onCopyAnswer) {
      onCopyAnswer(answer);
      setIsCopied(true);
    }
  };
  const shouldTruncate = answer.length > 300;
  const displayAnswer = isExpanded ? answer : answer.substring(0, 300);

  const handleStrategyAdd = (itemId: string, strategy: string) => {
    if (onStrategyAdd) {
      onStrategyAdd(itemId, strategy);
    }
    setNewStrategyValue("");
    setAddingStrategyToItem(null);
  };

  const handleNewTagSave = (itemId: string) => {
    if (newTagValue.trim() && onTagAdd) {
      onTagAdd(itemId, newTagValue.trim());
    }
    setNewTagValue("");
    setAddingTagToItem(null);
  };

  const handleNewTagCancel = () => {
    setNewTagValue("");
    setAddingTagToItem(null);
  };

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
             
              {/* Tags in Question Section */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {normalizeStrategies(displayData.strategy).map((strategy, index) => (
                  <Badge 
                    key={`${strategy}-${index}`} 
                    variant="outline" 
                    className="vault-tag flex items-center gap-1 cursor-pointer hover:bg-sidebar-background"
                    onClick={() => {
                      // Add click handler for editing strategies
                      console.log('Edit strategy:', strategy);
                    }}
                  >
                    <Lightbulb className="h-3 w-3" />
                    {strategy}
                    {onStrategyRemove && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:sidebar-accent" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onStrategyRemove(item.id, strategy);
                        }}
                      />
                    )}
                  </Badge>
                ))}
                {onStrategyAdd && addingStrategyToItem === item.id ? (
                  <Select 
                    value={newStrategyValue} 
                    onValueChange={(value) => {
                      handleStrategyAdd(item.id, value);
                    }}
                    onOpenChange={(open) => {
                      if (!open) {
                        setAddingStrategyToItem(null);
                        setNewStrategyValue("");
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs w-32">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.filter(strategy => 
                        !normalizeStrategies(displayData.strategy).includes(strategy)
                      ).map(strategyOption => (
                        <SelectItem key={strategyOption} value={strategyOption}>
                          {strategyOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : onStrategyAdd ? (
                  <Badge 
                    variant="outline" 
                    className="text-xs text-foreground vault-tag cursor-pointer hover:bg-sidebar-background flex items-center gap-1"
                    onClick={() => setAddingStrategyToItem(item.id)}
                  >
                    <Lightbulb className="h-3 w-3" />
                    + Strategy
                  </Badge>
                ) : null}
                {displayData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs vault-tag flex items-center gap-1">
                    {tag}
                    {onTagRemove && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-sidebar-accent" 
                        onClick={() => onTagRemove(item.id, tag)}
                      />
                    )}
                  </Badge>
                ))}
                {onTagAdd && addingTagToItem === item.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      className="h-6 text-xs w-24 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-foreground/20"
                      placeholder="Tag name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNewTagSave(item.id);
                        if (e.key === 'Escape') handleNewTagCancel();
                      }}
                    />
                    <button 
                      className="h-6 w-6 flex items-center justify-center border border-sidebar-primary bg-background hover:bg-sidebar-background rounded text-sidebar-primary hover:text-sidebar-primary/70 hover:border-sidebar-primary/70 transition-colors" 
                      onClick={() => handleNewTagSave(item.id)}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button 
                      className="h-6 w-6 flex items-center justify-center border border-sidebar-accent bg-background hover:bg-sidebar-background rounded text-sidebar-accent hover:text-sidebar-accent/70 hover:border-sidebar-accent/70 transition-colors" 
                      onClick={handleNewTagCancel}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : onTagAdd ? (
                  <Badge 
                    variant="outline" 
                    className="text-xs text-foreground vault-tag cursor-pointer hover:bg-sidebar-background"
                    onClick={() => setAddingTagToItem(item.id)}
                  >
                    + New
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="border-t border-foreground/20 px-6 py-3 flex items-center justify-end gap-2 rounded-b-lg bg-sidebar-background">
        {onEdit && (
          <button 
            className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium"
            style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        )}
        <button
          className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium"
          style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
          onClick={() => onArchive && onArchive(item.id)}
        >
          <Archive className="h-4 w-4" />
          {displayData.archived ? 'Restore' : 'Archive'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-background text-sm font-medium" style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}>
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
            className="flex h-8 px-2 pl-3 min-w-24 justify-center items-center gap-2 rounded-md text-sm font-medium bg-foreground hover:bg-foreground/80 border-foreground text-background"
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
              onStrategyRemove={onStrategyRemove}
              onStrategyAdd={onStrategyAdd}
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