import React from 'react';
import { Send, Paperclip, Type, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileCardProps {
  file: UploadedFile;
  onRemove: () => void;
  showRemoveButton?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove, showRemoveButton = true }) => {
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
    <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 min-w-0 flex-shrink-0">
      <span className="text-sm">{getFileIcon(file.type)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-foreground/60">{formatFileSize(file.size)}</p>
      </div>
      {showRemoveButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-foreground/60 hover:text-foreground"
        >
          ×
        </Button>
      )}
    </div>
  );
};

interface ChatInputProps {
  // Input value and handlers
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  
  // UI configuration
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // File upload functionality
  uploadedFiles?: UploadedFile[];
  onFileUpload?: (files: FileList | null) => void;
  onFileRemove?: (fileId: string) => void;
  
  // Layout variants
  variant?: 'main' | 'followup';
  
  // Additional features
  showFormatDropdown?: boolean;
  showAttachButton?: boolean;
  showFileCards?: boolean;
  showBottom?: boolean;
  
  // Clear functionality
  onClear?: () => void;
  showClearButton?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  autoFocus = false,
  uploadedFiles = [],
  onFileUpload,
  onFileRemove,
  variant = 'main',
  showBottom = true,
  showFormatDropdown = true,
  showAttachButton = true,
  showFileCards = true,
  onClear,
  showClearButton = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileUpload) {
      onFileUpload(e.target.files);
    }
  };

  const isMainVariant = variant === 'main';
  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className="relative flex flex-col bg-white/80 border border-foreground/30 backdrop-blur-sm transition focus:border-sidebar-primary focus-within:border-sidebar-primary focus-within:shadow-[0_5px_15px_hsla(60deg,21%,29%,0.30)] rounded-lg shadow-[0_3px_9px_hsla(0deg,0%,0%,0.09)]">

      <div className="flex items-center">
        {/* Main Input */}
        <Input
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-grow bg-transparent flex items-center resize-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none p-4 min-h-[60px] placeholder:text-foreground/60 text-foreground hover:shadow-none focus:shadow-none focus-visible:shadow-none"
        />

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center p-2 px-3 gap-2">

          {/* Clear Button */}
          {showClearButton && onClear && (
            <Button 
              onClick={onClear}
              variant="ghost"
              className="h-9 w-9 p-0 text-foreground/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Send Button */}
          <Button 
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            className="h-9 w-11 bg-sidebar-primary hover:text-foreground"
          >
            <Send className="h-5 w-5 text-sidebar-primary-foreground" />
          </Button>
        </div>
      </div>

      {showBottom && (
      <div className="flex items-center gap-2 p-1.5 border-t border-foreground/20">
        {/* File Upload Button */}
        {showAttachButton && (
          <div className="flex items-center pl-2">
            <input
              type="file"
              multiple
              className="hidden"
              id={`file-upload-${variant}`}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 text-foreground/70 hover:text-foreground"
              onClick={() => document.getElementById(`file-upload-${variant}`)?.click()}
            >
              <Paperclip className="h-5 w-5" />
              Attach
            </Button>
          </div>
        )}
        {/* Format Dropdown */}
        {showFormatDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 text-foreground/70 hover:text-foreground"
            >
              <div className="flex items-center gap-0">
                <Type className="h-5 w-5" />
              </div>
              Response Type
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Text</DropdownMenuItem>
            <DropdownMenuItem>Table</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>
      )}
      {hasFiles && showFileCards && (
        <div className="flex gap-2 p-3 pt-0 border-b border-foreground/10 overflow-x-auto">
          {uploadedFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRemove={() => onFileRemove?.(file.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};
