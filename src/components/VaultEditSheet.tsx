import { useState, useEffect } from "react";
import { X, Save, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ContentItem, QuestionItem } from "@/types/vault";
import { STRATEGIES } from "@/types/vault";

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
  const [newStrategy, setNewStrategy] = useState("");
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

  const handleAddStrategy = () => {
    if (newStrategy.trim() && !strategies.includes(newStrategy.trim())) {
      setStrategies([...strategies, newStrategy.trim()]);
      setNewStrategy("");
    }
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
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Editing Question/Answer</h2>
              <p className="text-sm text-muted-foreground mt-1">{(item as any).documentTitle || 'Unknown Document'}</p>
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
              
              {/* Current Strategies */}
              <div className="flex flex-wrap gap-2 mb-2">
                {strategies.map((strategy, index) => (
                  <Badge 
                    key={`${strategy}-${index}`} 
                    variant="outline" 
                    className="flex items-center gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {strategy}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleRemoveStrategy(strategy)}
                    />
                  </Badge>
                ))}
              </div>
              
              {/* Add New Strategy */}
              <div className="flex gap-2">
                <Select value={newStrategy} onValueChange={setNewStrategy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a strategy to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.filter(strategy => !strategies.includes(strategy)).map(strategyOption => (
                      <SelectItem key={strategyOption} value={strategyOption}>
                        {strategyOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  size="sm"
                  onClick={handleAddStrategy}
                  disabled={!newStrategy.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <Label>Tags</Label>
              
              {/* Existing Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
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
                  className="flex-1"
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
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
