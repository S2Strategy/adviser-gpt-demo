import { useState, useEffect } from "react";
import { X, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ContentItem, QuestionItem } from "@/types/vault";
import { STRATEGIES } from "@/types/vault";
import StrategySelector from "@/components/StrategySelector";

interface VaultEditSheetProps {
  item: QuestionItem;
  open: boolean;
  onClose: () => void;
  onSave: (editData: any) => void;
  existingEdit?: any;
}

export function VaultEditSheet({ item, open, onClose, onSave, existingEdit }: VaultEditSheetProps) {
  // Helper function to normalize strategies (convert single string to array)
  const normalizeStrategies = (strategy: string | string[]): string[] => {
    return Array.isArray(strategy) ? strategy : [strategy];
  };

  const [question, setQuestion] = useState(existingEdit?.question || item.question || "");
  const [answer, setAnswer] = useState(existingEdit?.answer || item.answer || "");
  const [strategies, setStrategies] = useState<string[]>(normalizeStrategies(existingEdit?.strategy || item.strategy));
  const [tags, setTags] = useState<string[]>(existingEdit?.tags || item.tags || []);
  const [newTag, setNewTag] = useState("");
  const [availableStrategies, setAvailableStrategies] = useState<string[]>(STRATEGIES);
  const { toast } = useToast();

  // Reset form when item changes
  useEffect(() => {
    if (existingEdit) {
      setQuestion(existingEdit.question || item.question || "");
      setAnswer(existingEdit.answer || item.answer || "");
      setStrategies(normalizeStrategies(existingEdit.strategy || item.strategy));
      setTags(existingEdit.tags || item.tags || []);
    } else {
      setQuestion(item.question || "");
      setAnswer(item.answer || "");
      setStrategies(normalizeStrategies(item.strategy));
      setTags(item.tags || []);
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

  const handleSave = () => {
    const editData = {
      question,
      answer,
      strategy: strategies,
      tags,
      updatedAt: new Date().toISOString(),
    };
    
    onSave(editData);
    
    toast({
      title: "Changes saved",
      description: "The question has been updated successfully.",
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveStrategy = (strategyToRemove: string) => {
    setStrategies(strategies.filter(strategy => strategy !== strategyToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
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

            {/* Strategy Field */}
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategies</Label>

              <StrategySelector
                value={strategies}
                onChange={setStrategies}
                options={availableStrategies}
                onCreateOption={(name) =>
                  setAvailableStrategies((prev) => (prev.includes(name) ? prev : [...prev, name]))
                }
                maxInline={3}
                size="sm"
                triggerLabel="Edit"
              />
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <Label>Tags</Label>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Existing Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-sidebar-accent/5 hover:text-sidebar-accent transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} 
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add new tag"
                    className="flex-1 h-9"
                  />
                  <Button 
                    onClick={handleAddTag} 
                    disabled={!newTag.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
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
