import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVaultEdits } from "@/hooks/useVaultState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTagTypes } from "@/hooks/useTagTypes";
import { STRATEGIES } from "@/types/vault";
import { migrateStrategyToTags } from "@/utils/tagMigration";
import { QuestionItem } from "@/types/vault";

export function SingleQAPair() {
  const { toast } = useToast();
  const { saveEdit } = useVaultEdits();
  const { profile } = useUserProfile();
  const { addTagTypeValue } = useTagTypes();
  
  const [strategy, setStrategy] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");

  const handleSave = () => {
    if (!strategy) {
      toast({
        title: "Strategy required",
        description: "Please select a strategy before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please enter an answer before saving.",
        variant: "destructive",
      });
      return;
    }

    // Ensure Strategy tag type exists and has the selected value
    const strategyTagType = "Strategy";
    const strategyValues = STRATEGIES;
    if (!strategyValues.includes(strategy)) {
      // Add new strategy value if it doesn't exist
      addTagTypeValue(strategyTagType, strategy);
    }

    // Create the new item
    const newItem: QuestionItem = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "Questionnaires",
      strategy: strategy, // Keep for backward compatibility
      tags: migrateStrategyToTags(strategy),
      question: question.trim(),
      answer: answer.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: profile.fullName || "Current User",
      documentTitle: "Manual Entry",
    };

    // Save to vault
    saveEdit(newItem.id, newItem);

    toast({
      title: "Saved to Vault ✓",
      description: "Your question and answer have been saved successfully.",
    });

    // Reset form
    setStrategy("");
    setQuestion("");
    setAnswer("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="strategy">
            Strategy <span className="text-destructive">*</span>
          </Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer"
            rows={6}
          />
        </div>

        <Button
          onClick={handleSave}
          className="bg-sidebar-primary hover:bg-sidebar-primary/80"
        >
          Save to Vault
        </Button>
      </div>
    </div>
  );
}

