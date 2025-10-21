import React, { useState, useRef } from 'react';
import {
  Copy,
  Save,
  Mail,
  ShieldCheck,
  Scissors,
  Ruler,
  Drama,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { SourceHighlightedText } from './SourceHighlightedText';


interface Answer {
  id: string;
  question: string;
  answer: string;
  version: number;
}

interface TrustAnswerCardProps {
  answer: Answer;
  mode?: 'answer' | 'chat' | 'riaOutreach';
  onCopy?: () => void;
  onSave?: (updatedAnswer?: Answer) => void;
  onEmail?: () => void;
  onEdit?: (type: 'grammar' | 'shorter' | 'longer' | 'tone', value?: string) => void;
}

export function TrustAnswerCard({
  answer,
  mode = 'answer',
  onCopy,
  onSave,
  onEmail,
  onEdit,
}: TrustAnswerCardProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(answer.answer);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer.answer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onCopy?.();
    toast({
      title: "Copied to clipboard ✓",
      description: "Answer copied successfully."
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(answer.answer);
    // Focus the contenteditable div after a brief delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(answer.answer);
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
    // Cancel editing when user clicks away or tabs out
    handleCancelEdit();
  };

  const handleSave = () => {
    if (isEditing) {
      // If we're in edit mode, save the edited content
      const updatedAnswer = { ...answer, answer: editedContent };
      onSave?.(updatedAnswer);
      setIsEditing(false);
      toast({
        title: "Saved to Vault ✓",
        description: "Edited answer has been saved to your Vault"
      });
    } else {
      // Original save behavior
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-background rounded-lg overflow-hidden border border-foreground/20 shadow-sm">
        {/* Header */}
        <div className="pt-2 px-4 bg-sidebar-background border-b border-foreground/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-accent text-white flex items-center gap-1">AdviserGPT • <span className="font-semibold">{mode === 'answer' ? 'Vault Only' : 'Vault + Web'}</span></Badge>
              {/* Trusted Language Badge - Only show for Answer Mode */}
              {mode === 'answer' && (
                <Badge variant="outline" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary">
                  <div className="flex items-center">
                    <span className="font-semibold">99%</span>
                  </div>
                  <span className="text-xs ml-1">Trusted Language</span>
                </Badge>
              )}
            </div>
            {/* Action Buttons - Only show for Answer Mode */}
            {mode === 'answer' && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopy}
                      className={isCopied ? "text-green-600" : ""}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
                {/* Save to Vault button - Only show for Answer Mode */}
                {mode === 'answer' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isEditing ? "Save Changes" : "Save to Vault"}</TooltipContent>
                  </Tooltip>
                )}
                {/* Email button - Only show for Answer Mode */}
                {mode === 'answer' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleEmail}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send as Email</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h5 className="text-md">AI Summary</h5>
            </div>
            <div className="text-xs text-foreground/70">
              Version {answer.version}
            </div>
          </div>

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
                className="text-foreground text-sm leading-6 p-3 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            ) : (
              <p 
                className="text-foreground text-sm cursor-pointer hover:bg-sidebar-background/30 p-2 rounded transition-colors"
                onClick={handleStartEdit}
                title="Click to edit"
              >
                <SourceHighlightedText text={answer.answer} />
              </p>
            )}


            {/* AI Edit Controls - Only show for Answer Mode */}
            {!isEditing && mode === 'answer' && (
              <div className="grid gap-2">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
