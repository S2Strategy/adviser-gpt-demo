import React, { useState, useEffect } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VaultSidebar } from '@/components/VaultSidebar';
import { DraftEditor } from '@/components/DraftsEditor';
import { DraftsAssistant, UploadedFile } from '@/components/DraftsAssistant';
import { useToast } from '@/hooks/use-toast';
import { useVaultEdits } from '@/hooks/useVaultState';
import { QuestionItem } from '@/types/vault';
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
  const [prompt, setPrompt] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

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

    setIsLoading(true);
    setStreamingText('');
    setHasPendingDiffs(false);
    setUpdatedContent(null);

    try {
      const params: GenerateDraftParams = {
        prompt: prompt.trim(),
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

    setIsLoading(true);
    setStreamingText('');
    // Use current content as the baseline (which may have been manually edited)
    const baselineContent = content;
    setOriginalContent(baselineContent);

    try {
      const params: UpdateDraftParams = {
        originalText: baselineContent,
        prompt: prompt.trim(),
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
      updatedBy: "Current User", // TODO: Get from auth context
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

  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background flex-shrink-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">Drafts</span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Drafts</h1>
                <p className="text-foreground/70">Generate and manage drafts</p>
              </div>
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
                onSave={handleSave}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
            </div>

            {/* Right: Drafts Assistant */}
            <div className="w-[400px] flex-shrink-0 overflow-hidden">
              <DraftsAssistant
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
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerateOrUpdate}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
