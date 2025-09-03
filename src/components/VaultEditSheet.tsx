import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ContentItem } from "@/types/vault";
import { STRATEGIES } from "@/types/vault";

interface VaultEditSheetProps {
  item: ContentItem;
  open: boolean;
  onClose: () => void;
  onSave: (editData: any) => void;
  existingEdit?: any;
}

export function VaultEditSheet({ item, open, onClose, onSave, existingEdit }: VaultEditSheetProps) {
  const [question, setQuestion] = useState(existingEdit?.question || item.content?.question || "");
  const [answer, setAnswer] = useState(existingEdit?.answer || item.content?.answer || "");
  const [strategy, setStrategy] = useState(existingEdit?.strategy || item.strategy);
  const [tags, setTags] = useState<string[]>(existingEdit?.tags || item.tags || []);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  // Reset form when item changes
  useEffect(() => {
    if (existingEdit) {
      setQuestion(existingEdit.question || item.content?.question || "");
      setAnswer(existingEdit.answer || item.content?.answer || "");
      setStrategy(existingEdit.strategy || item.strategy);
      setTags(existingEdit.tags || item.tags || []);
    } else {
      setQuestion(item.content?.question || "");
      setAnswer(item.content?.answer || "");
      setStrategy(item.strategy);
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
      strategy,
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
              <h2 className="text-lg font-semibold">Question</h2>
              <p className="text-sm text-muted-foreground mt-1">{item.title}</p>
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
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(strategyOption => (
                    <SelectItem key={strategyOption} value={strategyOption}>
                      {strategyOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
