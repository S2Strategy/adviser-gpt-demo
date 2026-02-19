import React, { useState, useEffect } from 'react';
import { ChevronRight, Home, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VaultSidebar } from '@/components/VaultSidebar';
import { DraftEditor } from '@/components/DraftsEditor';
import { DraftsAgent, UploadedFile } from '@/components/DraftsAgent';
import { useToast } from '@/hooks/use-toast';
import { useVaultEdits } from '@/hooks/useVaultState';
import { QuestionItem } from '@/types/vault';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SavedDraft } from '@/types/drafts';
import { useDrafts } from '@/contexts/DraftsContext';
import { Button } from '@/components/ui/button';
import { NewDraftDialog } from '@/components/NewDraftDialog';
import { SaveDraftDialog } from '@/components/SaveDraftDialog';
import { FiltersPanel, DateRange } from '@/components/FiltersPanel';
import {
  generateDraft,
  updateDraft,
  streamDraftGeneration,
  streamDraftUpdate,
  GenerateDraftParams,
  UpdateDraftParams,
} from '@/utils/draftsLLM';

export function Drafts() {
  const { toast } = useToast();
  const { saveEdit } = useVaultEdits();
  const { profile } = useUserProfile();
  const { savedDrafts } = useDrafts();

  // Editor state
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [updatedContent, setUpdatedContent] = useState<string | null>(null);
  const [hasPendingDiffs, setHasPendingDiffs] = useState(false);

  // File state
  const [sampleFile, setSampleFile] = useState<UploadedFile | null>(null);
  const [informationalFiles, setInformationalFiles] = useState<UploadedFile[]>([]);

  // Settings
  const [includeWebSources, setIncludeWebSources] = useState(false);
  const [includeVaultContent, setIncludeVaultContent] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [lastSentPrompt, setLastSentPrompt] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // Filter state management
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedTagFilters, setSelectedTagFilters] = useState<Record<string, string[]>>({});
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedPriorSamples, setSelectedPriorSamples] = useState<string[]>([]);
  const [fileHistory, setFileHistory] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showCtaMessage, setShowCtaMessage] = useState(false);

  // Dialog state
  const [showNewDraftDialog, setShowNewDraftDialog] = useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);

  // File handlers
  const handleSampleFileAdd = (file: File) => {
    const uploadedFile: UploadedFile = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
    };
    setSampleFile(uploadedFile);
    toast({
      title: "Sample file attached",
      description: `${file.name} has been added as a writing sample.`,
    });
  };

  const handleSampleFileRemove = () => {
    setSampleFile(null);
  };

  const handleInformationalFilesAdd = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
    }));
    setInformationalFiles(prev => [...prev, ...newFiles]);
    
    // Add to file history for prior samples filter
    const newHistoryEntries = newFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
    }));
    setFileHistory(prev => [...prev, ...newHistoryEntries]);
    
    toast({
      title: "Files uploaded ✓",
      description: `${files.length} file(s) added successfully.`,
    });
  };

  const handleInformationalFileRemove = (fileId: string) => {
    setInformationalFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Generate new draft
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const promptText = prompt.trim();
    setLastSentPrompt(promptText);
    setIsLoading(true);
    setStreamingText('');
    setHasPendingDiffs(false);
    setUpdatedContent(null);

    try {
      const params: GenerateDraftParams = {
        prompt: promptText,
        sampleFile: sampleFile || undefined,
        informationalFiles: informationalFiles.length > 0 ? informationalFiles : undefined,
        includeWebSources,
      };

      // Stream the response
      let finalContent = '';
      for await (const text of streamDraftGeneration(params)) {
        setStreamingText(text);
        setContent(text);
        finalContent = text;
      }

      setOriginalContent(finalContent);
      setPrompt('');
      setShowCtaMessage(true);
      
      // Add prompt to history (most recent first, avoid duplicates, limit to 20)
      setPromptHistory(prev => {
        const filtered = prev.filter(p => p !== promptText);
        return [promptText, ...filtered].slice(0, 20);
      });
      
      toast({
        title: "Draft generated ✓",
        description: "Your draft has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Error generating draft",
        description: "There was an error generating your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  // Update existing draft
  const handleUpdate = async () => {
    if (!prompt.trim() || !content.trim()) return;
    if (hasPendingDiffs) return;

    const promptText = prompt.trim();
    setLastSentPrompt(promptText);
    setIsLoading(true);
    setStreamingText('');
    // Use current content as the baseline (which may have been manually edited)
    const baselineContent = content;
    setOriginalContent(baselineContent);

    try {
      const params: UpdateDraftParams = {
        originalText: baselineContent,
        prompt: promptText,
        sampleFile: sampleFile || undefined,
        informationalFiles: informationalFiles.length > 0 ? informationalFiles : undefined,
        includeWebSources,
      };

      // Stream the response
      let newContent = '';
      for await (const text of streamDraftUpdate(params)) {
        setStreamingText(text);
        newContent = text;
      }

      setUpdatedContent(newContent);
      // Set content to newContent so user sees the updated text with redlines
      setContent(newContent);
      setHasPendingDiffs(true);
      setPrompt('');
      setShowCtaMessage(true);
      
      // Add prompt to history (most recent first, avoid duplicates, limit to 20)
      setPromptHistory(prev => {
        const filtered = prev.filter(p => p !== promptText);
        return [promptText, ...filtered].slice(0, 20);
      });
      
      toast({
        title: "Draft updated ✓",
        description: "Review the changes and accept or reject them.",
      });
    } catch (error) {
      console.error('Error updating draft:', error);
      toast({
        title: "Error updating draft",
        description: "There was an error updating your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  // Handle generate/update based on content state
  const handleGenerateOrUpdate = () => {
    if (content.trim()) {
      handleUpdate();
    } else {
      handleGenerate();
    }
  };

  // Accept diff - use current content (which may include manual edits)
  const handleAcceptDiff = () => {
    if (updatedContent) {
      // Use current content (may have manual edits) or fall back to updatedContent
      const finalContent = content.trim() || updatedContent;
      setContent(finalContent);
      setOriginalContent(finalContent);
      setUpdatedContent(null);
      setHasPendingDiffs(false);
      toast({
        title: "Changes accepted ✓",
        description: "The updated draft has been applied.",
      });
    }
  };

  // Reject diff - revert to original content
  const handleRejectDiff = () => {
    // Revert to original content
    setContent(originalContent);
    setUpdatedContent(null);
    setHasPendingDiffs(false);
    toast({
      title: "Changes rejected",
      description: "The draft has been reverted to the previous version.",
    });
  };

  // Copy handler
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  // Save to vault
  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please generate or enter an draft first.",
        variant: "destructive",
      });
      return;
    }

    const newItem: QuestionItem = {
      id: `draft-${Date.now()}`,
      type: "Drafts",
      tags: [],
      body: content,
      answer: content,
      updatedAt: new Date().toISOString(),
      updatedBy: profile.fullName || "Current User",
      documentTitle: "Drafts",
    };

    // Save to vault edits (similar to how other items are saved)
    saveEdit(newItem.id, {
      ...newItem,
      question: "Draft",
    });

    toast({
      title: "Saved to Vault ✓",
      description: "Your draft has been saved to the Vault.",
    });
  };

  // Edit AI tools
  const handleEdit = async (type: 'grammar' | 'shorter' | 'longer' | 'tone') => {
    if (!content.trim()) return;
    if (hasPendingDiffs) return; // Prevent editing while diffs are pending

    setIsLoading(true);
    // Use current content as baseline (which may have been manually edited)
    const baselineContent = content;
    setOriginalContent(baselineContent);

    try {
      const params: UpdateDraftParams = {
        originalText: baselineContent,
        prompt: `Apply ${type} edit`,
        editType: type,
        sampleFile: sampleFile || undefined,
        informationalFiles: informationalFiles.length > 0 ? informationalFiles : undefined,
        includeWebSources,
      };

      const updated = await updateDraft(params);
      setUpdatedContent(updated);
      // Set content to updated so user sees the changes with redlines
      setContent(updated);
      setHasPendingDiffs(true);
    } catch (error) {
      console.error('Error editing draft:', error);
      toast({
        title: "Error editing draft",
        description: "There was an error applying the edit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update content when streaming
  useEffect(() => {
    if (streamingText) {
      setContent(streamingText);
    }
  }, [streamingText]);

  const hasContent = content.trim().length > 0;

  // Handle loading saved draft
  const handleLoadDraft = (draft: SavedDraft) => {
    setContent(draft.content);
    setOriginalContent(draft.content);
    setUpdatedContent(null);
    setHasPendingDiffs(false);
    if (draft.prompt) {
      setPrompt(draft.prompt);
    }
    // Note: File restoration would require file storage/retrieval system
    toast({
      title: 'Draft loaded',
      description: `"${draft.title}" has been loaded.`,
    });
  };

  // Filter helper functions
  const handleClearAllFilters = () => {
    setSelectedTagFilters({});
    setSelectedDocuments([]);
    setSelectedDateRange(null);
    setSelectedPriorSamples([]);
  };

  // Prompt history handlers
  const handleDeletePromptHistory = (index: number) => {
    setPromptHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePromptFromHistory = (promptText: string) => {
    // This will be handled by DraftsAgent component
    // We'll pass the prompt text to trigger the save dialog
  };

  // Clear draft handler
  const handleClearDraft = () => {
    setContent('');
    setOriginalContent('');
    setUpdatedContent(null);
    setHasPendingDiffs(false);
    setPrompt('');
    setLastSentPrompt('');
    setShowCtaMessage(false);
    setPromptHistory([]); // Clear prompt history when starting new draft
    setSampleFile(null);
    setInformationalFiles([]);
    setIncludeWebSources(false);
    setIncludeVaultContent(false);
    handleClearAllFilters();
    toast({
      title: 'New draft',
      description: 'Ready to create a new draft.',
    });
  };

  // Handle save from NewDraftDialog
  const handleSaveFromNewDraft = () => {
    setShowNewDraftDialog(false);
    setShowSaveDraftDialog(true);
  };

  // Handle save completion - clear after saving and close NewDraftDialog
  const handleSaveDraftComplete = () => {
    setShowNewDraftDialog(false);
    handleClearDraft();
  };

  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-foreground/10 bg-background flex-shrink-0">
            {/* Main Title */}
            <div className="flex items-center justify-between px-6 py-6">
              <div>
                <h1 className="text-2xl font-semibold">Drafts</h1>
                <p className="text-foreground/70">Generate and manage drafts</p>
              </div>
              {hasContent && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewDraftDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Draft
                </Button>
              )}
            </div>
          </div>

          {/* Split Screen Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Drafts Editor */}
            <div className="flex-1 overflow-hidden">
              <DraftEditor
                content={content}
                onContentChange={setContent}
                originalContent={originalContent}
                updatedContent={updatedContent}
                hasPendingDiffs={hasPendingDiffs}
                onAcceptDiff={handleAcceptDiff}
                onRejectDiff={handleRejectDiff}
                onCopy={handleCopy}
                onDownload={() => {}}
                onSave={handleSave}
                onEdit={handleEdit}
                isLoading={isLoading}
                prompt={prompt}
                lastSentPrompt={lastSentPrompt}
                showCtaMessage={showCtaMessage}
                streamingText={streamingText}
                sampleFile={sampleFile}
                informationalFiles={informationalFiles}
                includeWebSources={includeWebSources}
              />
            </div>

            {/* Right: Drafts Agent */}
            <div className="w-[400px] flex-shrink-0 overflow-hidden">
              <DraftsAgent
                hasContent={hasContent}
                hasPendingDiffs={hasPendingDiffs}
                sampleFile={sampleFile}
                informationalFiles={informationalFiles}
                onSampleFileAdd={handleSampleFileAdd}
                onSampleFileRemove={handleSampleFileRemove}
                onInformationalFilesAdd={handleInformationalFilesAdd}
                onInformationalFileRemove={handleInformationalFileRemove}
                includeWebSources={includeWebSources}
                onIncludeWebSourcesChange={setIncludeWebSources}
                includeVaultContent={includeVaultContent}
                onIncludeVaultContentChange={setIncludeVaultContent}
                showFiltersPanel={showFiltersPanel}
                onShowFiltersPanelChange={setShowFiltersPanel}
                selectedTagFilters={selectedTagFilters}
                onTagFiltersChange={setSelectedTagFilters}
                selectedDocuments={selectedDocuments}
                onDocumentsChange={setSelectedDocuments}
                selectedDateRange={selectedDateRange}
                onDateRangeChange={setSelectedDateRange}
                selectedPriorSamples={selectedPriorSamples}
                onPriorSamplesChange={setSelectedPriorSamples}
                fileHistory={fileHistory}
                onClearAllFilters={handleClearAllFilters}
                prompt={prompt}
                onPromptChange={setPrompt}
                promptHistory={promptHistory}
                onDeletePromptHistory={handleDeletePromptHistory}
                onSavePromptFromHistory={handleSavePromptFromHistory}
                onGenerate={handleGenerateOrUpdate}
                isLoading={isLoading}
                onLoadPrompt={setPrompt}
                onLoadDraft={handleLoadDraft}
              />
            </div>
          </div>
        </div>

        {/* New Draft Dialog */}
        <NewDraftDialog
          open={showNewDraftDialog}
          onOpenChange={setShowNewDraftDialog}
          content={content}
          savedDrafts={savedDrafts}
          onSave={handleSaveFromNewDraft}
          onClear={handleClearDraft}
        />

        {/* Save Draft Dialog */}
        <SaveDraftDialog
          open={showSaveDraftDialog}
          onOpenChange={setShowSaveDraftDialog}
          content={content}
          prompt={prompt}
          sampleFile={sampleFile}
          informationalFiles={informationalFiles}
          includeWebSources={includeWebSources}
          onSaved={handleSaveDraftComplete}
        />
      </main>
    </div>
  );
}
