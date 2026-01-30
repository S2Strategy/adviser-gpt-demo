import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface AnswerDetailModalProps {
  open: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  tags: Array<{ type: string; value: string }>;
}

export function AnswerDetailModal({
  open,
  onClose,
  question,
  answer,
  tags,
}: AnswerDetailModalProps) {
  // Group tags by type
  const tagsByType = React.useMemo(() => {
    const grouped: Record<string, Array<{ type: string; value: string }>> = {};
    tags.forEach(tag => {
      if (!grouped[tag.type]) {
        grouped[tag.type] = [];
      }
      grouped[tag.type].push(tag);
    });
    return grouped;
  }, [tags]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Q&A Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0 space-y-4 mt-4 overflow-hidden">
          {/* Question Section */}
          <div className="flex-shrink-0">
            <div className="text-xs font-bold mb-2 text-foreground/70">
              Question:
            </div>
            <div className="text-sm font-medium text-foreground leading-relaxed">
              {question || '(empty)'}
            </div>
          </div>
          
          {/* Answer Section - Scrollable */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-xs font-bold mb-2 text-foreground/70">
              Answer:
            </div>
            <div className="flex-1 overflow-y-auto text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap border border-foreground/10 rounded p-4 bg-sidebar-background/30">
              {answer || '(empty)'}
            </div>
          </div>
          
          {/* Tags Section */}
          {/* {tags.length > 0 && (
            <div className="flex-shrink-0">
              <div className="text-xs font-bold mb-2 text-foreground/70">
                Tags:
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(tagsByType).map(([typeName, typeTags]) =>
                  typeTags.map((tag) => (
                    <Badge
                      key={`${tag.type}-${tag.value}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {typeName}: {tag.value}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
