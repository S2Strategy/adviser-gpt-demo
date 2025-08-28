import { Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface QuestionCardData {
  id: string;
  fileName: string;
  updatedAt: Date;
  updatedBy: string;
  question: string;
  answer: string;
  duration: string;
  strategy: string;
  tags: string[];
}

interface QuestionCardProps {
  data: QuestionCardData;
  hideFileName?: boolean;
}

export function QuestionCard({ data, hideFileName = false }: QuestionCardProps) {
  const { toast } = useToast();

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      toast({
        title: "Copied!",
        description: "Answer copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy answer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-vault-card border rounded-lg p-4 hover:shadow-[var(--shadow-vault-card)] transition-all duration-200 group">
      <div className="space-y-3">
        {/* Question */}
        <div>
          <h4 className="text-base font-medium text-vault-text-primary leading-tight mb-1">
            {data.question}
          </h4>
          {!hideFileName && (
            <p className="text-xs text-vault-text-muted">
              {data.fileName} • {formatDistanceToNow(data.updatedAt, { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Answer with integrated copy button */}
        <div className="relative bg-vault-answer-bg border rounded-md p-3">
          <p className="text-sm text-vault-text-secondary leading-relaxed pr-8">
            {data.answer}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAnswer}
            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-opacity"
            title="Copy answer"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}