import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edit, Check, X, Plus, ChevronDown, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { QuestionItem, Tag } from '@/types/vault';
import { useTagTypes } from '@/hooks/useTagTypes';
import { migrateQuestionItem } from '@/utils/tagMigration';
import { useUserProfile } from '@/hooks/useUserProfile';

type QAModalEditData = Pick<QuestionItem, "question" | "answer"> & {
  tags: Tag[];
  updatedAt: string;
  updatedBy: string;
};

type QAModalExistingEdit = Partial<Pick<QuestionItem ,"question" | "answer" | "updatedAt" | "updatedBy">> & {
  tags?: Tag[];
}

type ItemWithDocumentTitle = QuestionItem & { documentTitle?: string };

interface QADetailModalProps {
  open: boolean;
  onClose: () => void;
  item: QuestionItem;
  mode: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onSave: (editData: QAModalEditData) => void;
  existingEdit?: QAModalExistingEdit;
}

export function QADetailModal({
  open,
  onClose,
  item,
  mode: initialMode,
  onModeChange,
  onSave,
  existingEdit,
}: QADetailModalProps) {
  const { getAllTagTypes, getTagTypeValues, addTagTypeValue } = useTagTypes();
  const tagTypes = getAllTagTypes();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);

  const documentTitle = (item as ItemWithDocumentTitle).documentTitle ?? 'Unknown Document';

  // Migrate item to new format if needed
  const migratedItem = useMemo(() => migrateQuestionItem(item), [item]);

  // Initialize tags from existing edit or migrated item
  const getInitialTags = (): Tag[] => {
    if (existingEdit?.tags && Array.isArray(existingEdit.tags)) {
      if (existingEdit.tags.length > 0 && typeof existingEdit.tags[0] === 'object' && 'type' in existingEdit.tags[0]) {
        return existingEdit.tags as Tag[];
      }
    }
    return migratedItem.tags || [];
  };

  // Get display values (from existing edit or item)
  const displayQuestion = existingEdit?.question || item.question || '';
  const displayAnswer = existingEdit?.answer || item.answer || '';
  const displayTags = getInitialTags();

  // Edit form state
  const [question, setQuestion] = useState(displayQuestion);
  const [answer, setAnswer] = useState(displayAnswer);
  const [tags, setTags] = useState<Tag[]>(displayTags);
  
  // Tag selection state
  const [tagTypePopoverOpen, setTagTypePopoverOpen] = useState(false);
  const [valuePopoverOpen, setValuePopoverOpen] = useState(false);
  const [selectedTagType, setSelectedTagType] = useState<string | null>(null);
  const [tagValueSearchQuery, setTagValueSearchQuery] = useState("");
  const addTagButtonRef = useRef<HTMLButtonElement>(null);

  // Reset form when item or mode changes
  useEffect(() => {
    const migrated = migrateQuestionItem(item);
    if (existingEdit) {
      setQuestion(existingEdit.question || item.question || "");
      setAnswer(existingEdit.answer || item.answer || "");
      if (existingEdit.tags && Array.isArray(existingEdit.tags) && existingEdit.tags.length > 0) {
        if (typeof existingEdit.tags[0] === 'object' && 'type' in existingEdit.tags[0]) {
          setTags(existingEdit.tags as Tag[]);
        } else {
          setTags(migrated.tags || []);
        }
      } else {
        setTags(migrated.tags || []);
      }
    } else {
      setQuestion(item.question || "");
      setAnswer(item.answer || "");
      setTags(migrated.tags || []);
    }
  }, [item, existingEdit]);

  // Sync mode with prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Group tags by type for display
  const tagsByType = useMemo(() => {
    const grouped: Record<string, Array<{ type: string; value: string }>> = {};
    displayTags.forEach(tag => {
      if (!grouped[tag.type]) {
        grouped[tag.type] = [];
      }
      grouped[tag.type].push(tag);
    });
    return grouped;
  }, [displayTags]);

  // Get selected values for a tag type
  const getSelectedValuesForTagType = (tagTypeName: string): string[] => {
    return tags
      .filter(tag => tag.type === tagTypeName)
      .map(tag => tag.value);
  };

  // Get current tag type object
  const getCurrentTagType = () => {
    return tagTypes.find(tt => tt.name === selectedTagType);
  };

  // Filter tag values based on search query
  const filteredTagValues = () => {
    const tagType = getCurrentTagType();
    if (!tagType) return [];
    if (!tagValueSearchQuery) return tagType.values;
    return tagType.values.filter(value =>
      value.toLowerCase().includes(tagValueSearchQuery.toLowerCase())
    );
  };

  // Handle tag type selection
  const handleTagTypeSelect = (tagTypeName: string) => {
    setSelectedTagType(tagTypeName);
    setTagTypePopoverOpen(false);
    // Small delay to ensure the first popover closes before opening the second
    setTimeout(() => {
      setValuePopoverOpen(true);
    }, 100);
    setTagValueSearchQuery("");
  };

  // Handle tag value toggle
  const handleTagValueToggle = (value: string) => {
    if (!selectedTagType) return;
    
    const tag: Tag = { type: selectedTagType, value };
    const tagExists = tags.some(t => t.type === tag.type && t.value === tag.value);
    
    if (tagExists) {
      setTags(prev => prev.filter(t => !(t.type === tag.type && t.value === tag.value)));
    } else {
      setTags(prev => [...prev, tag]);
    }
  };

  // Handle adding tags (confirm selection)
  const handleAddTags = () => {
    setValuePopoverOpen(false);
    setSelectedTagType(null);
    setTagValueSearchQuery("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: Tag) => {
    setTags(prev => prev.filter(t => !(t.type === tagToRemove.type && t.value === tagToRemove.value)));
  };

  const handleEditClick = () => {
    setMode('edit');
    onModeChange?.('edit');
  };

  const handleCancel = () => {
    // Reset form to original values
    const migrated = migrateQuestionItem(item);
    if (existingEdit) {
      setQuestion(existingEdit.question || item.question || "");
      setAnswer(existingEdit.answer || item.answer || "");
      if (existingEdit.tags && Array.isArray(existingEdit.tags) && existingEdit.tags.length > 0) {
        if (typeof existingEdit.tags[0] === 'object' && 'type' in existingEdit.tags[0]) {
          setTags(existingEdit.tags as Tag[]);
        } else {
          setTags(migrated.tags || []);
        }
      } else {
        setTags(migrated.tags || []);
      }
    } else {
      setQuestion(item.question || "");
      setAnswer(item.answer || "");
      setTags(migrated.tags || []);
    }
    setMode('view');
    onModeChange?.('view');
  };

  const handleSave = () => {
    const editData:QAModalEditData = {
      question,
      answer,
      tags,
      updatedAt: new Date().toISOString(),
      updatedBy: profile?.fullName || item.updatedBy || 'Unknown User',
    };
    
    onSave(editData);
    
    toast({
      title: "Changes saved",
      description: "The question has been updated successfully.",
    });

    // Switch back to view mode after save
    setMode('view');
    onModeChange?.('view');
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-3 right-3 bottom-3 z-50 w-[70vw] bg-background border shadow-2xl rounded-lg transition-all duration-300 transform ${
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{
          height: 'calc(100vh - 24px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-foreground/10">
            <div>
              <h2 className="text-lg font-semibold">
                {mode === 'view' ? 'Q&A Details' : 'Edit Q&A'}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">{documentTitle}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {mode === 'view' ? (
              // View Mode
              <>
                {/* Question Section */}
                <div className="space-y-2">
                  <Label htmlFor="view-question">Question</Label>
                  <div className="text-sm text-foreground leading-relaxed">
                    {displayQuestion || '(empty)'}
                  </div>
                </div>
                
                {/* Answer Section */}
                <div className="space-y-2">
                  <Label htmlFor="view-answer">Answer</Label>
                  <div className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap border border-foreground/10 rounded p-4 bg-sidebar-background/30 min-h-48 max-h-96 overflow-y-auto">
                    {displayAnswer || '(empty)'}
                  </div>
                </div>
                
                {/* Tags Section */}
                {/* <div className="space-y-2">
                  <Label>Tags</Label>
                  {displayTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(tagsByType).map(([typeName, typeTags]) =>
                        typeTags.map((tag) => (
                          <Badge
                            key={`${tag.type}-${tag.value}`}
                            variant="outline"
                            className="text-xs vault-tag flex items-center gap-1 px-2 py-1"
                          >
                            <TagIcon className="h-3 w-3" />
                            <span>{typeName}: {tag.value}</span>
                          </Badge>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-foreground/50">No tags</div>
                  )}
                </div> */}
              </>
            ) : (
              // Edit Mode
              <>
                {/* Question Field */}
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-24 resize-none"
                    placeholder="Enter the question..."
                  />
                </div>

                {/* Answer Field */}
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-48 resize-none"
                    placeholder="Enter the answer..."
                  />
                </div>

                {/* Tags Section */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  
                  {/* Selected tags display */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={`${tag.type}-${tag.value}-${index}`}
                          variant="outline"
                          className="text-xs vault-tag flex items-center gap-1 px-2 py-1"
                        >
                          <TagIcon className="h-3 w-3" />
                          <span>{tag.type}: {tag.value}</span>
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-sidebar-accent"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Tag button and dropdowns */}
                  <div className="flex items-center gap-2 relative">
                    {!selectedTagType ? (
                      <Popover 
                        open={tagTypePopoverOpen} 
                        onOpenChange={setTagTypePopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            ref={addTagButtonRef}
                            type="button"
                            variant="outline"
                            className="h-9 px-3 text-sm font-normal"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Tag
                            <ChevronDown className="h-4 w-4 ml-1.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[200px]" align="start">
                          <Command>
                            <CommandList>
                              <CommandEmpty>No tag types found.</CommandEmpty>
                              <CommandGroup>
                                {tagTypes.map((tagType) => (
                                  <CommandItem
                                    key={tagType.id}
                                    onSelect={() => handleTagTypeSelect(tagType.name)}
                                    className="cursor-pointer"
                                  >
                                    {tagType.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Popover 
                        open={valuePopoverOpen} 
                        onOpenChange={(open) => {
                          setValuePopoverOpen(open);
                          if (!open) {
                            setSelectedTagType(null);
                            setTagValueSearchQuery("");
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            ref={addTagButtonRef}
                            type="button"
                            variant="outline"
                            className="h-9 px-3 text-sm font-normal"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Tag
                            <ChevronDown className="h-4 w-4 ml-1.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="p-0 w-[300px]" 
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder={`Search ${selectedTagType?.toLowerCase()}...`}
                              value={tagValueSearchQuery}
                              onValueChange={setTagValueSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No values found.</CommandEmpty>
                              <CommandGroup>
                                {filteredTagValues().map((value) => {
                                  const isSelected = getSelectedValuesForTagType(selectedTagType!).includes(value);
                                  return (
                                    <div
                                      key={value}
                                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-foreground/10 cursor-pointer"
                                      onClick={() => handleTagValueToggle(value)}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleTagValueToggle(value)}
                                      />
                                      <label className="text-sm font-normal cursor-pointer flex-1">
                                        {value}
                                      </label>
                                    </div>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                            {getSelectedValuesForTagType(selectedTagType!).length > 0 && (
                              <div className="border-t p-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleAddTags}
                                  className="w-full h-8"
                                >
                                  Add ({getSelectedValuesForTagType(selectedTagType!).length})
                                </Button>
                              </div>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-foreground/10 flex-shrink-0">
            {mode === 'view' ? (
              <Button onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
