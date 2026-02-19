import React, { useRef, useState, useMemo } from 'react';
import { Upload, X, Globe, PlusCircle, Save, FolderOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_CONTENT_ITEMS } from '@/data/mockVaultData';
import { migrateQuestionItems } from '@/utils/tagMigration';
import { SavePromptDialog } from '@/components/SavePromptDialog';
import { SavedPromptsPanel } from '@/components/SavedPromptsPanel';
import { SavedDraftsPanel } from '@/components/SavedDraftsPanel';
import { FiltersPanel, DateRange } from '@/components/FiltersPanel';
import { SavedDraft } from '@/types/drafts';
import { useToast } from '@/hooks/use-toast';
import { useVaultEdits } from '@/hooks/useVaultState';
import { Badge } from '@/components/ui/badge';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface FileCardProps {
  file: UploadedFile;
  onRemove: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove }) => {
  return (
    <div className="inline-flex items-center gap-1.5 bg-foreground/5 border border-foreground/10 rounded-md px-2 py-1 text-xs">
      <span className="text-foreground/70 truncate max-w-[200px]">{file.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0 text-foreground/50 hover:text-foreground shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

interface DraftsAgentProps {
  // Editor state
  hasContent: boolean;
  hasPendingDiffs: boolean;
  
  // Files
  sampleFile: UploadedFile | null;
  informationalFiles: UploadedFile[];
  onSampleFileAdd: (file: File) => void;
  onSampleFileRemove: () => void;
  onInformationalFilesAdd: (files: File[]) => void;
  onInformationalFileRemove: (fileId: string) => void;
  
  // Settings
  includeWebSources: boolean;
  onIncludeWebSourcesChange: (value: boolean) => void;
  includeVaultContent: boolean;
  onIncludeVaultContentChange: (value: boolean) => void;
  
  // Filter state
  showFiltersPanel: boolean;
  onShowFiltersPanelChange: (show: boolean) => void;
  selectedTagFilters: Record<string, string[]>;
  onTagFiltersChange: (filters: Record<string, string[]>) => void;
  selectedDocuments: string[];
  onDocumentsChange: (documents: string[]) => void;
  selectedDateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  selectedPriorSamples: string[];
  onPriorSamplesChange: (samples: string[]) => void;
  fileHistory: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  onClearAllFilters: () => void;
  
  // Prompt
  prompt: string;
  onPromptChange: (value: string) => void;
  
  // Actions
  onGenerate: () => void;
  isLoading?: boolean;
  
  // Saved items handlers
  onLoadPrompt?: (prompt: string) => void;
  onLoadDraft?: (draft: SavedDraft) => void;
}

export function DraftsAgent({
  hasContent,
  hasPendingDiffs,
  sampleFile,
  informationalFiles,
  onSampleFileAdd,
  onSampleFileRemove,
  onInformationalFilesAdd,
  onInformationalFileRemove,
  includeWebSources,
  onIncludeWebSourcesChange,
  includeVaultContent,
  onIncludeVaultContentChange,
  showFiltersPanel,
  onShowFiltersPanelChange,
  selectedTagFilters,
  onTagFiltersChange,
  selectedDocuments,
  onDocumentsChange,
  selectedDateRange,
  onDateRangeChange,
  selectedPriorSamples,
  onPriorSamplesChange,
  fileHistory,
  onClearAllFilters,
  prompt,
  onPromptChange,
  onGenerate,
  isLoading = false,
  onLoadPrompt,
  onLoadDraft,
}: DraftsAgentProps) {
  const { toast } = useToast();
  const { edits } = useVaultEdits();
  const informationalFilesInputRef = useRef<HTMLInputElement>(null);
  const [selectedDataFile, setSelectedDataFile] = useState<string>("");

  // Get available Samples from Vault: MOCK_CONTENT_ITEMS + edits (type "Samples" only)
  const sampleDocuments = useMemo(() => {
    const uniqueDocs = new Map<string, { id: string; name: string; uploadedAt: string; uploadedBy: string }>();

    // From MOCK_CONTENT_ITEMS: items with type Samples
    const mockItems = migrateQuestionItems(MOCK_CONTENT_ITEMS.flatMap(doc =>
      doc.items.map(item => ({
        ...item,
        documentTitle: doc.title,
        documentId: doc.id
      }))
    ));
    const samplesFromMock = mockItems.filter(item => item.type === "Samples");
    samplesFromMock.forEach(item => {
      const docId = item.documentId || item.id;
      const name = item.documentTitle || 'Untitled';
      if (!uniqueDocs.has(docId)) {
        uniqueDocs.set(docId, {
          id: docId,
          name,
          uploadedAt: item.updatedAt || '',
          uploadedBy: item.updatedBy || ''
        });
      }
    });

    // From edits: entries with type Samples (documents from Add Content -> Samples)
    Object.entries(edits).forEach(([itemId, edit]) => {
      const type = edit?.type;
      if (type !== "Samples") return;
      const documentId = edit.documentId || itemId;
      const documentTitle = edit.documentTitle || 'Untitled';
      if (!uniqueDocs.has(documentId)) {
        uniqueDocs.set(documentId, {
          id: documentId,
          name: documentTitle,
          uploadedAt: edit.updatedAt || '',
          uploadedBy: edit.updatedBy || ''
        });
      }
    });

    return Array.from(uniqueDocs.values());
  }, [edits]);

  // Get available Data Files
  const dataFiles = useMemo(() => {
    const allItems = migrateQuestionItems(MOCK_CONTENT_ITEMS.flatMap(doc => doc.items));
    const dataFileItems = allItems.filter(item => item.type === "Data Files" || item.type === "Quantitative");
    const uniqueDocs = new Map<string, { id: string; name: string; uploadedAt: string; uploadedBy: string }>();
    
    dataFileItems.forEach(item => {
      if (item.documentTitle && !uniqueDocs.has(item.documentTitle)) {
        uniqueDocs.set(item.documentTitle, {
          id: item.documentId || item.id,
          name: item.documentTitle,
          uploadedAt: item.updatedAt,
          uploadedBy: item.updatedBy
        });
      }
    });
    
    return Array.from(uniqueDocs.values());
  }, []);

  // Convert a Samples document to a File object (from MOCK and/or edits)
  const convertDocumentToFile = (docId: string): File => {
    const items: Array<{ question?: string; answer?: string; body?: string }> = [];

    // From MOCK_CONTENT_ITEMS: ContentItem with id === docId or items with documentId === docId
    const mockDoc = MOCK_CONTENT_ITEMS.find(d => d.id === docId);
    if (mockDoc) {
      const samplesItems = mockDoc.items.filter(item => item.type === "Samples");
      items.push(...samplesItems);
    } else {
      const mockItemsWithDocId = MOCK_CONTENT_ITEMS.flatMap(doc =>
        doc.items.filter(item => (item.documentId || doc.id) === docId && item.type === "Samples")
      );
      items.push(...mockItemsWithDocId);
    }

    // From edits: all entries with documentId === docId and type Samples
    Object.entries(edits).forEach(([, edit]) => {
      if (edit?.type === "Samples" && edit?.documentId === docId) {
        items.push({
          question: edit.question,
          answer: edit.answer,
          body: edit.body
        });
      }
    });

    if (items.length === 0) {
      throw new Error('No sample content found for this document');
    }

    const content = items
      .map(item => {
        const q = item.question || '';
        const a = item.answer || item.body || '';
        return q ? `Q: ${q}\nA: ${a}\n\n` : `${a}\n\n`;
      })
      .join('');

    const docName = sampleDocuments.find(d => d.id === docId)?.name || docId;
    const fileName = `${docName}.txt`;
    const blob = new Blob([content], { type: 'text/plain' });
    return new File([blob], fileName, { type: 'text/plain' });
  };

  const handleSampleSelect = (docId: string) => {
    try {
      const file = convertDocumentToFile(docId);
      onSampleFileAdd(file);
      toast({
        title: "Sample loaded from vault",
        description: "Document has been loaded as writing sample.",
      });
    } catch (error) {
      console.error('Error loading sample:', error);
      toast({
        title: "Error loading sample",
        description: error instanceof Error ? error.message : "Failed to load sample.",
        variant: "destructive",
      });
    }
  };

  const handleDataFileSelect = (docId: string) => {
    setSelectedDataFile(docId);
    // TODO: Load document and convert to File for onInformationalFilesAdd
    // For now, just track selection
  };

  const handleInformationalFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onInformationalFilesAdd(Array.from(files));
    }
    // Reset input so same files can be selected again
    if (informationalFilesInputRef.current) {
      informationalFilesInputRef.current.value = '';
    }
  };

  const buttonText = hasContent ? 'Update Draft' : 'Generate Draft';
  const placeholderText = hasContent ? 'What should I update?' : 'What should I write?';
  const isButtonDisabled = !prompt.trim() || isLoading || (hasContent && hasPendingDiffs);

  // Sample prompts for drafts
  const samplePrompts = [
    "Draft a market recap for U.S. equities in a specific time period.",
    "Summarize the attached Informational Inputs into a short email cover letter.",
    "Draft a quarterly commentary with the research files and attribution report as Informational Inputs for themes and data.",
    "Draft client talking points by using the attached meeting notes and portfolio report as Informational Inputs."
  ];

  const handleSamplePromptClick = (samplePrompt: string) => {
    onPromptChange(samplePrompt);
  };

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'prompts' | 'drafts'>('agent');

  const handleLoadPrompt = (promptText: string) => {
    onPromptChange(promptText);
    setActiveTab('agent');
    onLoadPrompt?.(promptText);
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    onLoadDraft?.(draft);
    setActiveTab('agent');
  };

  return (
    <div className="h-full flex flex-col bg-sidebar-background border-l border-foreground/10">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'agent' | 'prompts' | 'drafts')} className="h-full flex flex-col">
        <div className="p-4 h-[69px] border-b border-foreground/10">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agent" className="text-xs">Agent</TabsTrigger>
            <TabsTrigger value="prompts" className="text-xs">Saved Prompts</TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs">Saved Drafts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agent" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold mb-4">Drafts Agent</h2>
        </div>

        {/* Writing Sample - from Vault Add Content -> Samples only */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Writing Sample</Label>
          <p className="text-xs text-foreground/70">Choose a sample from the Vault to guide style, structure, and tone. Add samples via Vault → Add Content → Samples.</p>
          
          {sampleFile ? (
            <div className="flex flex-wrap gap-2">
              <FileCard file={sampleFile} onRemove={onSampleFileRemove} />
            </div>
          ) : sampleDocuments.length > 0 ? (
            <Select onValueChange={handleSampleSelect}>
              <SelectTrigger className="w-full font-medium">
                <FolderOpen className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select from Vault" />
              </SelectTrigger>
              <SelectContent>
                {sampleDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-foreground/60 py-2">
              No samples yet. Add samples via Vault → Add Content → Samples.
            </p>
          )}
        </div>

        {/* Add Informational Inputs Section */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Informational Inputs</Label>
          <p className="text-xs text-foreground/70">
          Add files with data to inform draft generation. These files are not stored.
          </p>
          
          {/* Data Files Dropdown */}
          {dataFiles.length > 0 && (
            <div className="mb-2">
              <Select value={selectedDataFile} onValueChange={handleDataFileSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Data File..." />
                </SelectTrigger>
                <SelectContent>
                  {dataFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <input
            ref={informationalFilesInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInformationalFilesSelect}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
          />
          {informationalFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {informationalFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onRemove={() => onInformationalFileRemove(file.id)}
                />
              ))}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => informationalFilesInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Informational Inputs
          </Button>
        </div>

        {/* Include Web Sources Toggle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <Label htmlFor="web-sources" className="text-sm font-medium">
                Include Web Sources
              </Label>
              <p className="text-xs text-foreground/70">
                Use web data when generating or updating draft.
              </p>
            </div>
            <Switch
              id="web-sources"
              checked={includeWebSources}
              onCheckedChange={onIncludeWebSourcesChange}
            />
          </div>
        </div>

        {/* Include Vault Content Toggle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <Label htmlFor="vault-content" className="text-sm font-medium">
                Include Vault Content
              </Label>
              <p className="text-xs text-foreground/70">
                Use content from your vault when generating or updating draft.
              </p>
            </div>
            <Switch
              id="vault-content"
              checked={includeVaultContent}
              onCheckedChange={onIncludeVaultContentChange}
            />
          </div>

          {/* Filter Button - Only show when Include Vault Content is enabled */}
        {includeVaultContent && (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => onShowFiltersPanelChange(true)}
              className="w-full flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Open Filters
              {(() => {
                const totalCount = Object.values(selectedTagFilters).reduce((sum, values) => sum + values.length, 0) +
                                 selectedDocuments.length + selectedPriorSamples.length +
                                 (selectedDateRange && selectedDateRange.type !== 'any' ? 1 : 0);
                return totalCount > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {totalCount}
                  </Badge>
                ) : null;
              })()}
            </Button>

            {/* Filter Badges */}
            {(Object.values(selectedTagFilters).some(values => values.length > 0) ||
              selectedDocuments.length > 0 || selectedPriorSamples.length > 0 ||
              (selectedDateRange && selectedDateRange.type !== 'any')) && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedTagFilters).map(([tagTypeName, values]) =>
                  values.map(value => (
                    <Badge key={`${tagTypeName}-${value}`} variant="secondary" className="flex items-center gap-1">
                      {tagTypeName}: {value}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => {
                          const newValues = values.filter(v => v !== value);
                          if (newValues.length === 0) {
                            const newFilters = { ...selectedTagFilters };
                            delete newFilters[tagTypeName];
                            onTagFiltersChange(newFilters);
                          } else {
                            onTagFiltersChange({ ...selectedTagFilters, [tagTypeName]: newValues });
                          }
                        }}
                      />
                    </Badge>
                  ))
                )}
                {selectedDocuments.map(doc => (
                  <Badge key={doc} variant="secondary" className="flex items-center gap-1">
                    {doc}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => onDocumentsChange(selectedDocuments.filter(d => d !== doc))}
                    />
                  </Badge>
                ))}
                {selectedPriorSamples.map(sampleId => {
                  const sample = fileHistory.find(f => f.id === sampleId);
                  return sample ? (
                    <Badge key={sampleId} variant="secondary" className="flex items-center gap-1">
                      {sample.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => onPriorSamplesChange(selectedPriorSamples.filter(id => id !== sampleId))}
                      />
                    </Badge>
                  ) : null;
                })}
                {selectedDateRange && selectedDateRange.type !== 'any' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedDateRange.type === 'custom' && selectedDateRange.from && selectedDateRange.to
                      ? `${selectedDateRange.from.toLocaleDateString()} - ${selectedDateRange.to.toLocaleDateString()}`
                      : selectedDateRange.type}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => onDateRangeChange(null)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
        </div>

        

        {/* Prompt Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Prompt
            </Label>
            {prompt.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="h-7 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholderText}
            className="min-h-32 resize-none"
            disabled={isLoading}
          />

        {/* Sample Prompts */}
        {!hasContent && (
          <div className="space-y-2">
            <p className="text-sm text-foreground/80">Try one of these examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {samplePrompts.map((samplePrompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-sm font-normal bg-sidebar-background/50 flex flex-wrap justify-between min-h-14 h-auto px-4 py-2 items-center text-sidebar-foreground hover:bg-sidebar-background/70 border-foreground/10 hover:border-foreground/20 whitespace-normal text-left"
                  onClick={() => handleSamplePromptClick(samplePrompt)}
                >
                  <span className="flex flex-1">{samplePrompt}</span>
                  <PlusCircle className="h-4 w-4 text-sidebar-foreground/70 flex-shrink-0 ml-2" />
                </Button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

          {/* Save Prompt Dialog */}
          <SavePromptDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            prompt={prompt}
          />

          {/* Generate Button */}
          <div className="p-6 border-t border-foreground/10">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onGenerate}
                    disabled={isButtonDisabled}
                    className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80"
                    size="lg"
                  >
                    {isLoading ? 'Generating...' : buttonText}
                  </Button>
                </div>
              </TooltipTrigger>
              {hasPendingDiffs && (
                <TooltipContent>
                  <p>Accept or reject changes before updating the draft again.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TabsContent>

        <TabsContent value="prompts" className="h-full overflow-hidden m-0">
          <SavedPromptsPanel onLoadPrompt={handleLoadPrompt} />
        </TabsContent>

        <TabsContent value="drafts" className="h-full overflow-hidden m-0">
          <SavedDraftsPanel onLoadDraft={handleLoadDraft} />
        </TabsContent>
      </Tabs>

      {/* Filters Panel */}
      {includeVaultContent && (
        <FiltersPanel
          isOpen={showFiltersPanel}
          onClose={() => onShowFiltersPanelChange(false)}
          selectedTagFilters={selectedTagFilters}
          onTagFiltersChange={onTagFiltersChange}
          selectedDocuments={selectedDocuments}
          onDocumentsChange={onDocumentsChange}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={onDateRangeChange}
          selectedPriorSamples={selectedPriorSamples}
          onPriorSamplesChange={onPriorSamplesChange}
          priorSamples={fileHistory}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  );
}

