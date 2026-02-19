import React, { useState } from 'react';
import { Copy, Save, ShieldCheck, Scissors, Ruler, Drama, Check, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { DraftBlockEditor } from './DraftBlockEditor';
import { diffWords } from 'diff';
import { SaveDraftDialog } from './SaveDraftDialog';
import { UploadedFile } from './DraftsAgent';

interface DraftEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  originalContent: string;
  updatedContent: string | null;
  hasPendingDiffs: boolean;
  onAcceptDiff: () => void;
  onRejectDiff: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
  onEdit: (type: 'grammar' | 'shorter' | 'longer' | 'tone') => void;
  isLoading?: boolean;
  prompt?: string;
  lastSentPrompt?: string;
  showCtaMessage?: boolean;
  streamingText?: string;
  sampleFile?: UploadedFile | null;
  informationalFiles?: UploadedFile[];
  includeWebSources?: boolean;
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
  onDownload,
  onSave,
  onEdit,
  isLoading = false,
  prompt,
  lastSentPrompt,
  showCtaMessage = false,
  streamingText = '',
  sampleFile,
  informationalFiles,
  includeWebSources,
}: DraftEditorProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Copied to clipboard ✓",
      description: "Draft copied successfully.",
    });
  };

  const handleDownload = () => {
    onDownload();
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
    toast({
      title: "Downloaded ✓",
      description: "Draft downloaded successfully.",
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
        <div className="flex items-center">
          {/* Edit AI Tools - always visible when content exists */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('grammar')}
                className="flex items-center gap-1.5"
                disabled={!content.trim() || isLoading || hasPendingDiffs}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Grammar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('shorter')}
                className="flex items-center gap-1.5"
                disabled={!content.trim() || isLoading || hasPendingDiffs}
              >
                <Scissors className="h-3 w-3" />
                <span>Shorter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('longer')}
                className="flex items-center gap-1.5"
                disabled={!content.trim() || isLoading || hasPendingDiffs}
              >
                <Ruler className="h-3 w-3" />
                <span>Longer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit('tone')}
                className="flex items-center gap-1.5"
                disabled={!content.trim() || isLoading || hasPendingDiffs}
              >
                <Drama className="h-3 w-3" />
                <span>Tone</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-1 justify-end items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className={isDownloaded ? "text-green-600" : ""}
                  disabled={!content.trim() || isLoading || hasPendingDiffs}
                >
                  {isDownloaded ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Draft</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={isCopied ? "text-green-600" : ""}
                  disabled={!content.trim() || isLoading || hasPendingDiffs}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Draft</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!content.trim() || isLoading || hasPendingDiffs}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Draft</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Conversational Editor Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* System reply: draft content */}
        {(content.trim() || isLoading) && (
          <div className="flex justify-start w-full">
            <div className="max-w-[90%] flex justify-start items-start flex-col w-full">
              <div className="p-4 pr-[50px] rounded-lg bg-white border border-foreground/10 text-foreground w-full relative">
                <DraftBlockEditor
                  content={content}
                  onContentChange={onContentChange}
                  disabled={isLoading}
                  placeholder="Your draft will appear here..."
                  isLoading={isLoading}
                  streamingText={streamingText}
                />
                {hasPendingDiffs && changeCount > 0 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-foreground/10">
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
              </div>
            </div>
          </div>
        )}

        {/* System reply: CTA to use Agent panel (only after generation completes) */}
        {showCtaMessage && (
          <div className="flex justify-start self-start rounded-lg bg-white border border-foreground/10 p-4">
            <p className="text-sm text-foreground/80">
              You can update or adjust your prompt in the Agent panel to the right to refine this draft.
            </p>
          </div>
        )}
      </div>

      {/* Save Draft Dialog */}
      <SaveDraftDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        content={content}
        prompt={prompt}
        sampleFile={sampleFile}
        informationalFiles={informationalFiles}
        includeWebSources={includeWebSources}
      />
    </div>
  );
}

