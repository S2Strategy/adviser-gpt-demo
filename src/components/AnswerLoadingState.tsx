import React, { useState, useRef, useEffect } from 'react';
import { Copy, Save, Mail, Check, ShieldCheck, Scissors, Ruler, Drama } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { SourceHighlightedText } from './SourceHighlightedText';
import { DateRange } from './FiltersPanel';

interface Answer {
  id: string;
  question: string;
  answer: string;
  version: number;
  uploadedFiles?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
  }>;
  filters?: {
    tags: string[];
    strategies: string[];
    documents: string[];
    dateRange?: DateRange | null;
    priorSamples: Array<{
      id: string;
      name: string;
      type: string;
    }>;
  };
}

interface AnswerLoadingStateProps {
  progress: number;
  currentStep: string;
  sourcesFound: number;
  mode?: 'answer' | 'chat' | 'riaOutreach';
  streamingText?: string;
  isTransitioning?: boolean;
  answer?: Answer;
  onCopy?: () => void;
  onSave?: (updatedAnswer?: Answer) => void;
  onEmail?: () => void;
  onEdit?: (type: 'grammar' | 'shorter' | 'longer' | 'tone', value?: string) => void;
}

export function AnswerLoadingState({ 
  progress, 
  sourcesFound,
  mode = 'answer',
  streamingText = '',
  isTransitioning = false,
  answer,
  onCopy,
  onSave,
  onEmail,
  onEdit
}: AnswerLoadingStateProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(answer?.answer || '');
  const [isProgressCollapsed, setIsProgressCollapsed] = useState(false);
  const [shouldRemoveProgress, setShouldRemoveProgress] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle progress bar collapse animation when answer is complete
  useEffect(() => {
    if (answer && !isProgressCollapsed) {
      // Start collapse animation
      setIsProgressCollapsed(true);
      
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRemoveProgress(true);
      }, 500); // Match the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [answer, isProgressCollapsed]);

  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(answer.answer);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onCopy?.();
      toast({
        title: "Copied to clipboard ✓",
        description: "Answer copied successfully."
      });
    }
  };

  const handleSave = () => {
    if (isEditing && answer) {
      const updatedAnswer = { ...answer, answer: editedContent };
      onSave?.(updatedAnswer);
      setIsEditing(false);
      toast({
        title: "Saved to Vault ✓",
        description: "Edited answer has been saved to your Vault"
      });
    } else {
      onSave?.();
      toast({
        title: "Saved to Vault ✓",
        description: "Answer saved to RIA Strategy / Investment Process"
      });
    }
  };

  const handleEmail = () => {
    onEmail?.();
    toast({
      title: "Email opened",
      description: "Your default email client has opened with the formatted text."
    });
  };

  const handleEdit = (type: 'grammar' | 'shorter' | 'longer' | 'tone', value?: string) => {
    onEdit?.(type, value);
    toast({
      title: "Updated ✓",
      description: `Answer ${type} has been applied.`
    });
  };

  const handleStartEdit = () => {
    if (answer) {
      setIsEditing(true);
      setEditedContent(answer.answer);
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
        }
      }, 100);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(answer?.answer || '');
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setEditedContent(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleBlur = () => {
    handleCancelEdit();
  };

  // Determine if we're in the final state (answer is complete)
  const isComplete = answer && progress >= 100;

  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="bg-background rounded-lg border border-foreground/20 shadow-sm">
        {/* Loading Header */}
        <div className="pt-2 px-4 bg-sidebar-background rounded-t-lg border-b border-foreground/10 transition-all duration-500 ease-out">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-accent text-white flex items-center gap-1">
                AdviserGPT • <span className="font-semibold">{mode === 'answer' ? 'Vault Only' : mode === 'chat' ? 'Vault + Web' : 'RIA Outreach'}</span>
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center gap-2 ${
              isComplete
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 -translate-y-2 m-0'
              }`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    className={isCopied ? "text-accent" : ""}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isEditing ? "Save Changes" : "Save to Vault"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleEmail}>
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send as Email</TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {!shouldRemoveProgress && (
          <div className={`space-y-2 transition-all duration-200 ease-out transform  ${
            isProgressCollapsed
              ? 'opacity-0 -translate-y-10 max-h-0 p-0 m-0' 
              : 'opacity-100 max-h-30'
            }`}>
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <span>Assembling your firm's approved content...</span>
              <span>{sourcesFound > 0 ? `Gathering ${sourcesFound} relevant sources...` : 'Searching Vault...'}</span>
            </div>
            
            {/* Progress Bar */}
              <div className="space-y-1 transition-all duration-500">
                <Progress value={progress} className="h-2 bg-foreground/10" />
                <div className="text-xs text-foreground/70 text-center">
                  {Math.round(progress)}% complete
                </div>
              </div>
          </div>
          )}
          </div>

        {/* Body */}
        <div className="p-4">
          {!isComplete ? (
            /* Streaming Answer Text */
            <div className="prose max-w-none space-y-2">
              <p className="text-foreground text-sm p-3 leading-6">
                <span>{streamingText}</span>
                {streamingText && (
                  <span className="w-2 h-5 bg-foreground animate-pulse ml-1" />
                )}
              </p>
            </div>
          ) : (
            /* Final Answer Content */
            <div className="prose max-w-none space-y-2">
              {/* Content */}
              <div className="prose max-w-none space-y-6">
                {isEditing ? (
                  <div 
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="text-foreground text-sm leading-6 p-3 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                    dangerouslySetInnerHTML={{ __html: editedContent }}
                  />
                ) : (
                  <p 
                    className="text-foreground text-sm cursor-pointer hover:bg-sidebar-background/30 p-2 rounded transition-colors"
                    onClick={handleStartEdit}
                    title="Click to edit"
                  >
                    <SourceHighlightedText text={answer?.answer || ''} />
                  </p>
                )}
                <div className="grid gap-2 px-2">
                  <p className="text-xs text-gray-600">Adjust answer with AI</p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleEdit('grammar')}
                      className="flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Grammar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleEdit('shorter')}
                      className="flex items-center gap-1.5"
                    >
                      <Scissors className="h-3 w-3" />
                      <span>Shorter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleEdit('longer')}
                      className="flex items-center gap-1.5"
                    >
                      <Ruler className="h-3 w-3" />
                      <span>Longer</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleEdit('tone')}
                      className="flex items-center gap-1.5"
                    >
                      <Drama className="h-3 w-3" />
                      <span>Tone</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
