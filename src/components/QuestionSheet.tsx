import { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QuestionSheetProps {
  data: {
    id: string;
    fileName: string;
    updatedAt: Date;
    updatedBy: string;
    question: string;
    answer: string;
    duration: string;
    strategy: string;
    tags: string[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionSheet({ data, open, onOpenChange }: QuestionSheetProps) {
  const [question, setQuestion] = useState(data.question);
  const [answer, setAnswer] = useState(data.answer);
  const [duration, setDuration] = useState(data.duration);
  const [strategy, setStrategy] = useState(data.strategy);
  const [tags, setTags] = useState(data.tags);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    // Mock save functionality
    toast({
      title: "Changes saved",
      description: "The question has been updated successfully.",
    });
    onOpenChange(false);
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

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sheet */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l shadow-[var(--shadow-sheet)] transition-transform transform translate-x-0"
        style={{
          filter: 'drop-shadow(0 0 0 rgba(0,0,0,0.1)) drop-shadow(0 10px 38px rgba(22,23,24,0.35))',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Question</h2>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Evergreen">Evergreen</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Firm Wide (Not Strategy Specific)">
                      Firm Wide (Not Strategy Specific)
                    </SelectItem>
                    <SelectItem value="Large Cap Growth">Large Cap Growth</SelectItem>
                    <SelectItem value="Small Cap Growth">Small Cap Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-vault-tag text-vault-tag-foreground cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    #{tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-48"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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