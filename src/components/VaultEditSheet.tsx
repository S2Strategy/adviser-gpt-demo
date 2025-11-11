import { useState, useEffect, useMemo } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { QuestionItem, Tag } from "@/types/vault";
import { useTagTypes } from "@/hooks/useTagTypes";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { migrateQuestionItem } from "@/utils/tagMigration";

interface VaultEditSheetProps {
  item: QuestionItem;
  open: boolean;
  onClose: () => void;
  onSave: (editData: any) => void;
  existingEdit?: any;
}

export function VaultEditSheet({ item, open, onClose, onSave, existingEdit }: VaultEditSheetProps) {
  const { getAllTagTypes, getTagTypeValues, addTagTypeValue } = useTagTypes();
  const tagTypes = getAllTagTypes();
  const { toast } = useToast();

  // Migrate item to new format if needed
  const migratedItem = useMemo(() => migrateQuestionItem(item), [item]);

  // Initialize tags from existing edit or migrated item
  const getInitialTags = (): Tag[] => {
    if (existingEdit?.tags && Array.isArray(existingEdit.tags)) {
      // Check if already in new format
      if (existingEdit.tags.length > 0 && typeof existingEdit.tags[0] === 'object' && 'type' in existingEdit.tags[0]) {
        return existingEdit.tags as Tag[];
      }
    }
    // Use migrated item tags
    return migratedItem.tags || [];
  };

  const [question, setQuestion] = useState(existingEdit?.question || item.question || "");
  const [answer, setAnswer] = useState(existingEdit?.answer || item.answer || "");
  const [tags, setTags] = useState<Tag[]>(getInitialTags());

  // Reset form when item changes
  useEffect(() => {
    const migrated = migrateQuestionItem(item);
    if (existingEdit) {
      setQuestion(existingEdit.question || item.question || "");
      setAnswer(existingEdit.answer || item.answer || "");
      // Handle tags - check if already migrated
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

  // Body scroll lock when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // ESC key handler to close the edit panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Get selected values for a tag type
  const getSelectedValuesForType = (tagTypeName: string): string[] => {
    return tags
      .filter(tag => tag.type === tagTypeName)
      .map(tag => tag.value);
  };

  // Handle tag type selection change
  const handleTagTypeChange = (tagTypeName: string, selectedValues: string[]) => {
    // Get current allowed values for this tag type
    const allowedValues = getTagTypeValues(tagTypeName);
    
    // Auto-add any selected values that aren't in the allowed list
    selectedValues.forEach(value => {
      if (!allowedValues.includes(value)) {
        addTagTypeValue(tagTypeName, value);
      }
    });
    
    // Remove all tags of this type
    const otherTags = tags.filter(tag => tag.type !== tagTypeName);
    // Add new tags for selected values
    const newTags = selectedValues.map(value => ({
      type: tagTypeName,
      value,
    }));
    setTags([...otherTags, ...newTags]);
  };

  const handleSave = () => {
    const editData = {
      question,
      answer,
      tags, // Save in new format
      updatedAt: new Date().toISOString(),
    };
    
    onSave(editData);
    
    toast({
      title: "Changes saved",
      description: "The question has been updated successfully.",
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed top-3 right-3 bottom-3 z-50 w-full max-w-2xl bg-background border shadow-2xl rounded-lg transition-all duration-300 transform ${
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
              <h2 className="text-lg font-semibold">Edit Question/Answer</h2>
              <p className="text-sm text-foreground/70 mt-1">{(item as any).documentTitle || 'Unknown Document'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            {/* Tag Types - Each type on separate row */}
            {tagTypes.map((tagType) => {
              const availableValues = getTagTypeValues(tagType.name);
              const selectedValues = getSelectedValuesForType(tagType.name);
              
              // Include selected values in options even if not in allowed list
              const optionsWithSelected = Array.from(
                new Set([...availableValues, ...selectedValues])
              ).sort();
              
              return (
                <div key={tagType.id} className="flex items-center gap-2f">
                  <Label>{tagType.name}</Label>
                  <MultiSelectFilter
                    title={tagType.name}
                    options={optionsWithSelected}
                    selectedValues={selectedValues}
                    onSelectionChange={(values) => handleTagTypeChange(tagType.name, values)}
                    placeholder={`Select ${tagType.name.toLowerCase()}...`}
                    size="sm"
                  />
                </div>
              );
            })}

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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-foreground/10">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
