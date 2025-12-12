import React, { useState } from 'react';
import { Copy, Save, ShieldCheck, Scissors, Ruler, Drama, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { InlineDiffEditor } from './InlineDiffEditor';
import { diffWords } from 'diff';

interface DraftEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  originalContent: string;
  updatedContent: string | null;
  hasPendingDiffs: boolean;
  onAcceptDiff: () => void;
  onRejectDiff: () => void;
  onCopy: () => void;
  onSave: () => void;
  onEdit: (type: 'grammar' | 'shorter' | 'longer' | 'tone') => void;
  isLoading?: boolean;
}

export function DraftEditor({
  content,
  onContentChange,
  originalContent,
  updatedContent,
  hasPendingDiffs,
  onAcceptDiff,
  onRejectDiff,
  onCopy,
  onSave,
  onEdit,
  isLoading = false,
}: DraftEditorProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Copied to clipboard ✓",
      description: "Draft copied successfully.",
    });
  };

  const handleSave = () => {
    onSave();
    toast({
      title: "Saved to Vault ✓",
      description: "Draft saved successfully.",
    });
  };

  const handleEdit = (type: 'grammar' | 'shorter' | 'longer' | 'tone') => {
    onEdit(type);
    toast({
      title: "Updated ✓",
      description: `Draft ${type} has been applied.`,
    });
  };

  // Calculate change count when there are diffs
  const getChangeCount = () => {
    if (!hasPendingDiffs || !updatedContent) return 0;
    const diff = diffWords(originalContent, updatedContent);
    let count = 0;
    for (let i = 0; i < diff.length; i++) {
      if (diff[i].removed) {
        count++;
      } else if (diff[i].added && (i === 0 || !diff[i - 1].removed)) {
        count++;
      }
    }
    return count;
  };

  const changeCount = getChangeCount();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-foreground/10 bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Drafts Editor</h2>
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
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!content.trim() || isLoading}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to Vault</TooltipContent>
            </Tooltip> */}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Inline Diff Editor - always visible */}
          <InlineDiffEditor
            content={content}
            onContentChange={onContentChange}
            originalContent={originalContent}
            updatedContent={updatedContent}
            hasPendingDiffs={hasPendingDiffs}
            disabled={isLoading}
            placeholder="Your draft will appear here..."
          />
          
          {/* Accept/Reject Controls - visible when there are pending diffs */}
          {hasPendingDiffs && changeCount > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
              <div className="text-sm text-foreground/70">
                {changeCount} {changeCount === 1 ? 'change' : 'changes'} detected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onRejectDiff}
                  className="text-sidebar-accent hover:text-sidebar-accent hover:bg-sidebar-accent/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={onAcceptDiff}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          )}
          
          {/* Edit AI Tools - always visible when content exists */}
          {(content.trim() || (hasPendingDiffs && updatedContent)) && (
            <div className="space-y-2 pt-4 border-t border-foreground/10">
              <p className="text-xs text-foreground/70 mb-2">Adjust draft with AI</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit('grammar')}
                  className="flex items-center gap-1.5"
                  disabled={isLoading || hasPendingDiffs}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Grammar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit('shorter')}
                  className="flex items-center gap-1.5"
                  disabled={isLoading || hasPendingDiffs}
                >
                  <Scissors className="h-3 w-3" />
                  <span>Shorter</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit('longer')}
                  className="flex items-center gap-1.5"
                  disabled={isLoading || hasPendingDiffs}
                >
                  <Ruler className="h-3 w-3" />
                  <span>Longer</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit('tone')}
                  className="flex items-center gap-1.5"
                  disabled={isLoading || hasPendingDiffs}
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
  );
}

