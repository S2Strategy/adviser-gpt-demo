import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  File,
  Image,
  FileSpreadsheet,
  FileType,
  Filter,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelectFilter } from './MultiSelectFilter';
import { STRATEGIES, CONTENT_TYPES, TAGS_INFO } from '@/types/vault';

interface PriorSample {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedStrategies: string[];
  onStrategiesChange: (strategies: string[]) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedPriorSamples: string[];
  onPriorSamplesChange: (samples: string[]) => void;
  priorSamples: PriorSample[];
  onClearAll: () => void;
}

export function FiltersPanel({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  selectedStrategies,
  onStrategiesChange,
  selectedTypes,
  onTypesChange,
  selectedPriorSamples,
  onPriorSamplesChange,
  priorSamples,
  onClearAll
}: FiltersPanelProps) {
  const [priorSamplesSearch, setPriorSamplesSearch] = useState('');

  if (!isOpen) return null;

  const filteredPriorSamples = priorSamples.filter(sample =>
    sample.name.toLowerCase().includes(priorSamplesSearch.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileType;
    if (type.includes('image')) return Image;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type.includes('text') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePriorSampleToggle = (sampleId: string) => {
    const newSelection = selectedPriorSamples.includes(sampleId)
      ? selectedPriorSamples.filter(id => id !== sampleId)
      : [...selectedPriorSamples, sampleId];
    
    onPriorSamplesChange(newSelection);
  };

  const totalFiltersCount = selectedTags.length + selectedStrategies.length + 
                           selectedTypes.length + selectedPriorSamples.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 transition duration-200" onClick={onClose}>
      <div 
        className={`fixed right-4 top-4 h-[calc(100%-32px)] flex flex-col w-120 bg-background rounded-2xl shadow-xl transition-all duration-300 transform
          ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Search Filters</h2>
            <p className="text-sm text-foreground/70">
              Scope your search with filters
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Tags Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <MultiSelectFilter
                title="Tags"
                options={TAGS_INFO.map(tag => tag.name)}
                selectedValues={selectedTags}
                onSelectionChange={onTagsChange}
                placeholder="Select tags"
                size="sm"
              />
              {selectedTags.length > 0 && (
                <p className="text-xs text-foreground/60 mt-1">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Strategies Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Strategies</h3>
              <MultiSelectFilter
                title="Strategies"
                options={STRATEGIES}
                selectedValues={selectedStrategies}
                onSelectionChange={onStrategiesChange}
                placeholder="Select strategies"
                size="sm"
              />
              {selectedStrategies.length > 0 && (
                <p className="text-xs text-foreground/60 mt-1">
                  {selectedStrategies.length} strateg{selectedStrategies.length !== 1 ? 'ies' : 'y'} selected
                </p>
              )}
            </div>

            {/* Document Types Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Document Types</h3>
              <MultiSelectFilter
                title="Document Types"
                options={CONTENT_TYPES}
                selectedValues={selectedTypes}
                onSelectionChange={onTypesChange}
                placeholder="Select document types"
                size="sm"
              />
              {selectedTypes.length > 0 && (
                <p className="text-xs text-foreground/60 mt-1">
                  {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Prior Samples Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Prior Samples</h3>
              {priorSamples.length === 0 ? (
                <div className="text-center py-6 text-sm text-foreground/60">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-foreground/30" />
                  <p>No files uploaded yet</p>
                  <p className="text-xs">Upload files to use them as search filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search bar for prior samples */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground/70" />
                    <Input
                      placeholder="Search files..."
                      value={priorSamplesSearch}
                      onChange={(e) => setPriorSamplesSearch(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>

                  {/* Prior samples list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredPriorSamples.length === 0 ? (
                      <div className="text-center py-4 text-sm text-foreground/60">
                        No files found
                      </div>
                    ) : (
                      filteredPriorSamples.map((sample) => {
                        const FileIcon = getFileIcon(sample.type);
                        const isSelected = selectedPriorSamples.includes(sample.id);
                        
                        return (
                          <div
                            key={sample.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-sidebar-primary/10 border-sidebar-primary/20' 
                                : 'hover:bg-foreground/5 border-foreground/10'
                            }`}
                            onClick={() => handlePriorSampleToggle(sample.id)}
                          >
                            <div className="flex-shrink-0">
                              <FileIcon className="h-4 w-4 text-foreground/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{sample.name}</p>
                              <p className="text-xs text-foreground/60">
                                {formatFileSize(sample.size)} • {formatDate(sample.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected && (
                                <Check className="h-4 w-4 text-sidebar-primary" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {selectedPriorSamples.length > 0 && (
                    <p className="text-xs text-foreground/60">
                      {selectedPriorSamples.length} file{selectedPriorSamples.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-foreground/70">
              {totalFiltersCount > 0 ? (
                <span>{totalFiltersCount} filter{totalFiltersCount !== 1 ? 's' : ''} active</span>
              ) : (
                <span>No filters selected</span>
              )}
            </div>
            {totalFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          <Button
            onClick={onClose}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/80"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
