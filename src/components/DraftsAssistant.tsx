import React, { useRef } from 'react';
import { Upload, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📁';
  };

  return (
    <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 min-w-0">
      <span className="text-sm">{getFileIcon(file.type)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-foreground/60">{formatFileSize(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 text-foreground/60 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface DraftsAssistantProps {
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
  
  // Prompt
  prompt: string;
  onPromptChange: (value: string) => void;
  
  // Actions
  onGenerate: () => void;
  isLoading?: boolean;
}

export function DraftsAssistant({
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
  prompt,
  onPromptChange,
  onGenerate,
  isLoading = false,
}: DraftsAssistantProps) {
  const sampleFileInputRef = useRef<HTMLInputElement>(null);
  const informationalFilesInputRef = useRef<HTMLInputElement>(null);

  const handleSampleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onSampleFileAdd(files[0]);
    }
    // Reset input so same file can be selected again
    if (sampleFileInputRef.current) {
      sampleFileInputRef.current.value = '';
    }
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

  return (
    <div className="h-full flex flex-col bg-sidebar-background border-l border-foreground/10">
      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold mb-4">Drafts Assistant</h2>
        </div>

        {/* Add Sample Section */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Writing Sample</Label>
          <p className="text-xs text-foreground/70">Add a sample to guide the style, structure, and tone only.</p>
          <input
            ref={sampleFileInputRef}
            type="file"
            className="hidden"
            onChange={handleSampleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
          />
          {sampleFile ? (
            <div className="space-y-2">
              <FileCard file={sampleFile} onRemove={onSampleFileRemove} />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => sampleFileInputRef.current?.click()}
              className="w-full"
              disabled={!!sampleFile}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Sample
            </Button>
          )}
        </div>

        {/* Add Informational Inputs Section */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Informational Inputs</Label>
          <p className="text-xs text-foreground/70">
            Add files with data to use for draft generation.
          </p>
          <input
            ref={informationalFilesInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInformationalFilesSelect}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
          />
          {informationalFiles.length > 0 && (
            <div className="space-y-2">
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

        {/* Prompt Input */}
        <div className="space-y-3">
          <Label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholderText}
            className="min-h-32 resize-none"
            disabled={isLoading}
          />
        </div>
      </div>

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
    </div>
  );
}

