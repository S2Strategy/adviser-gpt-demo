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
  onToggleExpansion?: (itemId: string) => void;
  onEdit?: (item: QuestionItem) => void;
  onCopyAnswer?: (answer: string) => void;
  onStrategyRemove?: (itemId: string, strategy: string) => void;
  onStrategyAdd?: (itemId: string, strategy: string) => void;
  onTagRemove?: (itemId: string, tag: string) => void;
  onTagAdd?: (itemId: string, tag: string) => void;
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
  onToggleExpansion,
  onEdit,
  onCopyAnswer,
  onStrategyRemove,
  onStrategyAdd,
  onTagRemove,
  onTagAdd,
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

  return (
    <div className="border rounded-lg bg-card vault-result-card">
      {/* Header with file info and badge */}
      <div className="flex items-start justify-between pb-4 border-b border-[#E4E4E7] px-6 py-4">
        <div className="flex items-center min-w-0 gap-3 flex-1">
          {!fileName && (
            <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#71717A' }} />
          )}
          {!fileName && (
            <div 
              className="font-bold break-words min-w-0 text-sm"
              style={{ 
                wordBreak: 'break-word',
                hyphens: 'auto',
                fontSize: '14px', 
                lineHeight: '1.4' 
              }}
            >
              {item.documentTitle || 'Unknown Document'}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm" style={{ fontSize: '14px', lineHeight: '1.4' }}>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-4 w-4" style={{ color: '#71717A' }} />
              <span style={{ color: '#71717A' }}>Last edited</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-grid border border-t-0 border-x-0 border-b-1 border-dashed border-gray-300 cursor-help" style={{ color: '#27272A' }}>
                    {formatRelativeTime(item.updatedAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                    {formatFullDate(item.updatedAt)}
                  </p>
                </TooltipContent>
              </Tooltip>
              
              <span style={{ color: '#71717A' }}>by</span>
              <span style={{ color: '#27272A' }}>{item.updatedBy}</span>
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
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#CCECB6', color: '#09090B' }}>
              <Star className="h-3 w-3" />
              <span className="text-xs font-semibold">Best Answer</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer Section */}
      {displayData.answer && (
        <div className="space-y-2 px-6 py-4">
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Answer</h4>
          <div className="bg-muted/50 rounded-md p-4">
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
            <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#71717A' }} />
            <div className="space-y-2">
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Question</h4>
              <p 
                style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '700', letterSpacing: '-0.4px' }}
                dangerouslySetInnerHTML={{ __html: highlightSearchTerms(displayData.question, query) }}
              />
             
              {/* Tags in Question Section */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {normalizeStrategies(displayData.strategy).map((strategy, index) => (
                  <Badge 
                    key={`${strategy}-${index}`} 
                    variant="outline" 
                    className="vault-tag flex items-center gap-1 cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      // Add click handler for editing strategies
                      console.log('Edit strategy:', strategy);
                    }}
                  >
                    <Lightbulb className="h-3 w-3" />
                    {strategy}
                    {onStrategyRemove && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
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
                    className="text-xs text-muted-foreground vault-tag cursor-pointer hover:bg-muted flex items-center gap-1"
                    style={{ backgroundColor: '#F4F4F5' }}
                    onClick={() => setAddingStrategyToItem(item.id)}
                  >
                    <Lightbulb className="h-3 w-3" />
                    + Strategy
                  </Badge>
                ) : null}
                {displayData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs vault-tag flex items-center gap-1" style={{ backgroundColor: '#F4F4F5' }}>
                    {tag}
                    {onTagRemove && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
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
                      className="h-6 text-xs w-20"
                      placeholder="Tag name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNewTagSave(item.id);
                        if (e.key === 'Escape') handleNewTagCancel();
                      }}
                    />
                    <button 
                      className="h-6 w-6 flex items-center justify-center border border-green-200 bg-white hover:bg-green-50 rounded text-green-600 hover:text-green-700 hover:border-green-300 transition-colors" 
                      onClick={() => handleNewTagSave(item.id)}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button 
                      className="h-6 w-6 flex items-center justify-center border border-red-200 bg-white hover:bg-red-50 rounded text-red-500 hover:text-red-600 hover:border-red-300 transition-colors" 
                      onClick={handleNewTagCancel}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : onTagAdd ? (
                  <Badge 
                    variant="outline" 
                    className="text-xs text-muted-foreground vault-tag cursor-pointer hover:bg-muted"
                    style={{ backgroundColor: '#F4F4F5' }}
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
      <div className="border-t border-[#E4E4E7] px-6 py-3 flex items-center justify-end gap-2 rounded-b-lg" style={{ backgroundColor: '#fafafa' }}>
        {onEdit && (
          <button 
            className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium"
            style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        )}
        <button 
          className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium"
          style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
        >
          <Archive className="h-4 w-4" />
          Archive
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 px-2 pl-3 justify-center items-center gap-2 rounded-md bg-white text-sm font-medium" style={{ boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}>
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
            className="flex h-8 px-2 pl-3 min-w-24 justify-center items-center gap-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: '#18181B', color: '#fafafa', boxShadow: '0 0 0 1px rgba(3, 7, 18, 0.12), 0 1px 3px -1px rgba(3, 7, 18, 0.11), 0 2px 5px 0 rgba(3, 7, 18, 0.06)' }}
            onClick={handleCopyAnswer}
          >
            {isCopied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
};