import { Copy, Mail, Edit, Check, Bookmark, Clock, User, Tag, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookmarks } from "@/hooks/useBookmarks";

export interface QuestionCardData {
  id: string;
  fileName: string;
  updatedAt: Date;
  updatedBy: string;
  question: string;
  answer: string;
  duration: string;
  strategy: string;
  tags: string[];
  contentType?: string;
  expirationDate?: Date;
}

interface QuestionCardProps {
  data: QuestionCardData;
  hideFileName?: boolean;
  onEdit?: (data: QuestionCardData) => void;
  onTagAdd?: (id: string, tag: string) => void;
  onTagRemove?: (id: string, tag: string) => void;
  onQuickEdit?: (id: string, field: string, value: string) => void;
}

export function QuestionCard({ 
  data, 
  hideFileName = false, 
  onEdit, 
  onTagAdd, 
  onTagRemove, 
  onQuickEdit 
}: QuestionCardProps) {
  // Custom cursor-following tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isSticky, setIsSticky] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Inline editing states
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingStrategy, setEditingStrategy] = useState(false);
  
  const answerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const stickyTimeoutRef = useRef<NodeJS.Timeout>();
  const copiedTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { toggleBookmark, isBookmarked } = useBookmarks();

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      setIsCopied(true);
      setTooltipVisible(true);
      setIsSticky(true);
      
      // Reset copied state after 3 seconds
      clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
        setTooltipVisible(false);
        setIsSticky(false);
      }, 3000);
    } catch (error) {
      // Silently fail - could add error state if needed
    }
  };

  const updateTooltipPosition = useCallback((e: React.MouseEvent) => {
    if (!answerRef.current || isSticky) return;
    
    const rect = answerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 15; // 15px offset from cursor
    const y = e.clientY - rect.top + 15;
    
    // Ensure tooltip stays within answer area bounds
    const maxX = rect.width - 200; // Account for tooltip width
    const maxY = rect.height - 50; // Account for tooltip height
    
    setTooltipPosition({
      x: Math.min(x, maxX),
      y: Math.min(y, maxY)
    });
  }, [isSticky]);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTooltipVisible(true);
      setIsSticky(false);
    }, 200);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateTooltipPosition(e);
    
    // Reset sticky timeout on movement
    clearTimeout(stickyTimeoutRef.current);
    if (tooltipVisible && !isSticky) {
      stickyTimeoutRef.current = setTimeout(() => {
        setIsSticky(true);
      }, 800);
    }
  };

  const handleMouseLeave = () => {
    // Don't hide tooltip if in copied state
    if (isCopied) return;
    
    clearTimeout(timeoutRef.current);
    clearTimeout(stickyTimeoutRef.current);
    setTooltipVisible(false);
    setIsSticky(false);
  };

  const handleEmailAnswer = () => {
    const subject = encodeURIComponent(`Question: ${data.question}`);
    const body = encodeURIComponent(`Question: ${data.question}\n\nAnswer: ${data.answer}\n\nFile: ${data.fileName}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleEdit = () => {
    onEdit?.(data);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      onTagAdd?.(data.id, newTag.trim());
      setNewTag("");
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagRemove?.(data.id, tag);
  };

  const handleStrategyChange = (newStrategy: string) => {
    onQuickEdit?.(data.id, 'strategy', newStrategy);
    setEditingStrategy(false);
  };

  const getContentTypeColor = (contentType?: string) => {
    switch (contentType) {
      case 'RFP': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DDQ': return 'bg-green-100 text-green-800 border-green-200';
      case 'Policy': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Commentary': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isExpiring = data.expirationDate && data.expirationDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const isExpired = data.expirationDate && data.expirationDate <= new Date();

  return (
    <div className="group px-6 py-6 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
      {/* Header with Question and Bookmark */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-foreground leading-tight flex-1">
          {data.question}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${isBookmarked(data.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
          onClick={() => toggleBookmark(data.id)}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked(data.id) ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Enhanced Metadata */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {data.updatedBy}
        </div>
        
        {/* Content Type */}
        {data.contentType && (
          <Badge className={`text-xs ${getContentTypeColor(data.contentType)}`}>
            {data.contentType}
          </Badge>
        )}
        
        {/* Expiration Status */}
        {isExpired && (
          <Badge variant="destructive" className="text-xs">
            Expired
          </Badge>
        )}
        {isExpiring && !isExpired && (
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
            Expiring Soon
          </Badge>
        )}
        
        {/* Strategy with Quick Edit */}
        {editingStrategy ? (
          <Select value={data.strategy} onValueChange={handleStrategyChange}>
            <SelectTrigger className="h-6 text-xs w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Firm Wide (Not Strategy Specific)">Firm Wide</SelectItem>
              <SelectItem value="Large Cap Growth">Large Cap Growth</SelectItem>
              <SelectItem value="Small Cap Growth">Small Cap Growth</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-accent"
            onClick={() => setEditingStrategy(true)}
          >
            {data.strategy}
          </Badge>
        )}
      </div>

      {/* Enhanced Tags Section */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {data.tags.map((tag) => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="text-xs group/tag cursor-pointer hover:bg-secondary/80"
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
            {onTagRemove && (
              <X 
                className="h-3 w-3 ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
              />
            )}
          </Badge>
        ))}
        
        {/* Add Tag */}
        {onTagAdd && (
          isAddingTag ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag"
                className="h-6 text-xs w-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setIsAddingTag(false);
                    setNewTag('');
                  }
                }}
                onBlur={() => {
                  if (!newTag.trim()) {
                    setIsAddingTag(false);
                  }
                }}
                autoFocus
              />
              <Button size="sm" className="h-6 px-2" onClick={handleAddTag}>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => setIsAddingTag(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          )
        )}
      </div>
      
      {!hideFileName && (
        <p className="text-sm text-muted-foreground mb-4">
          {data.fileName}
        </p>
      )}

      {/* Answer with cursor-following tooltip and hover actions */}
      <div className="relative group/answer">
        <div 
          ref={answerRef}
          className="text-base text-foreground leading-relaxed mb-4 cursor-pointer transition-colors hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md relative"
          onClick={handleCopyAnswer}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {data.answer}
          
          {/* Custom cursor-following tooltip */}
          {tooltipVisible && (
            <div 
              className={`absolute pointer-events-none z-50 px-3 py-2 text-sm font-medium rounded-md shadow-lg transition-all duration-300 flex items-center gap-2 ${
                isCopied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-foreground text-background'
              } ${isSticky ? 'opacity-100' : 'opacity-90'}`}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: isSticky ? 'none' : 'translateY(-2px)',
                transition: isSticky ? 'all 0.3s ease-out' : 'opacity 0.2s ease-out',
              }}
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                'Click anywhere to copy answer'
              )}
              {isSticky && !isCopied && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Floating action bar - appears on hover */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/answer:opacity-100 transition-all duration-200 pointer-events-none group-hover/answer:pointer-events-auto">
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCopyAnswer}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy answer</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleEmailAnswer}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email answer</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => toggleBookmark(data.id)}
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${isBookmarked(data.id) ? 'text-yellow-500' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked(data.id) ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked(data.id) ? 'Remove bookmark' : 'Add bookmark'}</p>
              </TooltipContent>
            </Tooltip>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit question</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}