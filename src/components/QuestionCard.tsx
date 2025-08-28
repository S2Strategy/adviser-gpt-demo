import { Copy, Mail, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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
}

interface QuestionCardProps {
  data: QuestionCardData;
  hideFileName?: boolean;
  onEdit?: (data: QuestionCardData) => void;
}

export function QuestionCard({ data, hideFileName = false, onEdit }: QuestionCardProps) {
  const { toast } = useToast();
  
  // Custom cursor-following tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isSticky, setIsSticky] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const stickyTimeoutRef = useRef<NodeJS.Timeout>();

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      toast({
        title: "Copied!",
        description: "Answer copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy answer",
        variant: "destructive",
      });
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

  return (
    <div className="group px-6 py-6 border-b border-border last:border-0">
      {/* Question */}
      <h3 className="text-lg font-semibold text-foreground leading-tight mb-3">
        {data.question}
      </h3>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })} by {data.updatedBy}
        </span>
        {data.tags && data.tags.length > 0 && (
          <div className="flex gap-2">
            {data.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{data.tags.length - 3}
              </Badge>
            )}
          </div>
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
              className={`absolute pointer-events-none z-50 px-3 py-2 text-sm font-medium bg-foreground text-background rounded-md shadow-lg transition-opacity duration-200 ${
                isSticky ? 'opacity-100' : 'opacity-90'
              }`}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: isSticky ? 'none' : 'translateY(-2px)',
                transition: isSticky ? 'all 0.3s ease-out' : 'opacity 0.2s ease-out',
              }}
            >
              Click anywhere to copy answer
              {isSticky && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          )}
        </div>
        
        {/* Floating action bar - appears on hover */}
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