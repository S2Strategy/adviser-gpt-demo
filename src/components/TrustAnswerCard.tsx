import React, { useState, useRef } from 'react';
import {
  Copy,
  Save,
  Mail,
  ShieldCheck,
  Scissors,
  Ruler,
  Drama,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  X,
  Plus,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { SourceHighlightedText } from './SourceHighlightedText';
import { HIGHLIGHT_COLORS } from '@/lib/colors';
import { Source } from '@/hooks/useChatResults';


interface ComplianceCheck {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  suggestion?: string;
}

interface Answer {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  vaultRatio: number;
  aiRatio: number;
  lastSynced: Date;
  version: number;
  complianceChecks?: ComplianceCheck[];
}

interface TrustAnswerCardProps {
  answer: Answer;
  mode?: 'answer' | 'chat';
  onCopy?: () => void;
  onSave?: (updatedAnswer?: Answer) => void;
  onEmail?: () => void;
  onEdit?: (type: 'grammar' | 'shorter' | 'longer' | 'tone', value?: string) => void;
  onSourceRemove?: (sourceId: string) => void;
  onSourceAdd?: () => void;
  onRebuild?: () => void;
  onComplianceFix?: (checkId: string) => void;
  onComplianceFixAll?: () => void;
}

export function TrustAnswerCard({
  answer,
  mode = 'answer',
  onCopy,
  onSave,
  onEmail,
  onEdit,
  onSourceRemove,
  onSourceAdd,
  onRebuild,
  onComplianceFix,
  onComplianceFixAll
}: TrustAnswerCardProps) {
  // Helper function to format source names for web sources
  const formatSourceName = (source: Source) => {
    if (source.type === 'web') {
      // Extract website name from the source name
      // Format: "Article Title - WebsiteName" -> "Article Title - WebsiteName"
      // If it already has the format, keep it; otherwise, try to extract website name
      if (source.name.includes(' - ')) {
        return source.name; // Already formatted
      }
      // For web sources, try to extract a clean website name
      return source.name;
    }
    return source.name; // For documents, keep original name
  };

  const { toast } = useToast();
  const [showSources, setShowSources] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
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

  const handleComplianceFix = (checkId: string) => {
    onComplianceFix?.(checkId);
    toast({
      title: "Compliance fix applied ✓",
      description: "The issue has been resolved."
    });
  };

  const handleComplianceFixAll = () => {
    onComplianceFixAll?.();
    toast({
      title: "All compliance fixes applied ✓",
      description: "All issues have been resolved."
    });
  };

  const passedChecks = answer.complianceChecks?.filter(check => check.status === 'passed') || [];
  const failedChecks = answer.complianceChecks?.filter(check => check.status === 'failed') || [];
  const warningChecks = answer.complianceChecks?.filter(check => check.status === 'warning') || [];

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
          
          {/* Trust Metrics */}
          <div className="space-y-1 pb-2">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/70 flex items-center gap-2">
                  {mode === 'answer' ? (
                    <>
                      <span className="flex items-center gap-1">
                        <div className={`w-[3px] h-3 rounded-full ${HIGHLIGHT_COLORS.vault.indicator}`}></div>
                        Vault: <span className="font-medium">{answer.vaultRatio}% firm-approved language</span>
                      </span>
                      <span className="text-foreground/50">|</span>
                      <span className="flex items-center gap-1">
                        <div className={`w-[3px] h-3 rounded-full ${HIGHLIGHT_COLORS.ai.indicator}`}></div>
                        AI: <span className="font-medium">{answer.aiRatio}% formatting</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
                        Web: <span className="font-medium">{100 - answer.vaultRatio}% research</span>
                      </span>
                      <span className="text-foreground/50">|</span>
                      <span className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${HIGHLIGHT_COLORS.vault.indicator}`}></div>
                        Vault: <span className="font-medium">{answer.vaultRatio}% firm data</span>
                      </span>
                    </>
                  )}
                </span>
              </div>
              {/* Vault updated text - Only show for Answer Mode */}
              {mode === 'answer' && (
                <span>Vault updated {answer.lastSynced.toLocaleDateString()}</span>
              )}
            </div>
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
                className="text-foreground text-sm p-3 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            ) : (
              <p 
                className="text-foreground text-sm cursor-pointer hover:bg-sidebar-background/30 p-2 rounded transition-colors"
                onClick={handleStartEdit}
                title="Click to edit"
              >
                <SourceHighlightedText text={answer.answer} sources={answer.sources} aiRatio={answer.aiRatio} />
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

        {/* Footer Controls */}
        <div className="p-4 bg-sidebar-background/50 border-t border-foreground/10">

          {/* Source Management */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1.5"
              >
                <span>View Sources</span>
                <span className="flex items-center justify-center h-5 w-5 bg-accent text-white text-xs font-medium rounded-full">
                  {answer.sources.length}
                </span>
                {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              {/* Add Vault sources button - Only show for Answer Mode */}
              {mode === 'answer' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSourceAdd}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Vault sources</span>
                </Button>
              )}
              {/* Compliance Review - Only show for Answer Mode
              {mode === 'answer' && (
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCompliance(!showCompliance)}
                    className="flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Run Checks</span>
                    {failedChecks.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {failedChecks.length} issue{failedChecks.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {showCompliance ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
              )} */}
            </div>
            {/* Rebuild button - Only show for Answer Mode */}
            {mode === 'answer' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRebuild}
                className="flex items-center gap-1.5"
              >
                <span>Rebuild</span>
              </Button>
            )}
          </div>

          {/* Sources Collapsible */}
          <Collapsible open={showSources} onOpenChange={setShowSources}>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="border rounded-lg p-3 bg-background border-foreground/10">
                <h4 className="font-medium text-sm mb-2">Sources used for this answer</h4>
                <div className="space-y-2">
                  {answer.sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-2 border border-foreground/10 rounded">
                      <div className="flex items-center gap-2">
                        {source.type === 'web' ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-foreground/50" />
                        )}
                        <span className="text-sm font-medium">{formatSourceName(source)}</span>
                        {source.type !== 'web' && (
                        <Badge variant="outline" 
                        className={`text-xs whitespace-nowrap ${
                          source.similarity >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                          source.similarity >= 80 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {source.similarity}% match
                        </Badge>
                        )}
                        {source.strategy && mode !== 'chat' && (
                          <Badge variant="outline" className="text-xs bg-sidebar-background/60 border-foreground/10">
                            {source.strategy}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {source.type !== 'web' && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          View Doc
                        </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onSourceRemove?.(source.id)}
                          className="h-6 w-6 p-0 text-foreground/70 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          

          {/* Compliance Results - Only show for Answer Mode */}
          {mode === 'answer' && (
            <Collapsible open={showCompliance} onOpenChange={setShowCompliance}>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="border rounded-lg p-4 bg-white">
                {/* Passed Checks */}
                {passedChecks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Passed Checks
                    </h4>
                    <div className="space-y-2">
                      {passedChecks.map((check) => (
                        <div key={check.id} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">{check.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed Checks */}
                {failedChecks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Needs Review
                    </h4>
                    <div className="space-y-2">
                      {failedChecks.map((check) => (
                        <div key={check.id} className="p-3 bg-red-50 rounded border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-red-800">{check.title}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleComplianceFix(check.id)}
                              className="text-xs"
                            >
                              Fix with AI
                            </Button>
                          </div>
                          <p className="text-sm text-red-700">{check.description}</p>
                          {check.suggestion && (
                            <p className="text-xs text-red-600 mt-1 italic">{check.suggestion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleComplianceFixAll}
                      className="w-full mt-2"
                    >
                      Fix all issues with AI
                    </Button>
                  </div>
                )}

                {/* Warning Checks */}
                {warningChecks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-yellow-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </h4>
                    <div className="space-y-2">
                      {warningChecks.map((check) => (
                        <div key={check.id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">{check.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
