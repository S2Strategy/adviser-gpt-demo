import React from 'react';
import { diffWords } from 'diff';

interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface DraftDiffViewerProps {
  originalText: string;
  updatedText: string;
}

export function DraftDiffViewer({ originalText, updatedText }: DraftDiffViewerProps) {
  // Calculate word-level diff
  const diff = diffWords(originalText, updatedText);
  
  // Count changes - count pairs of removed+added as single changes
  let changeCount = 0;
  for (let i = 0; i < diff.length; i++) {
    if (diff[i].removed) {
      changeCount++;
    } else if (diff[i].added && (i === 0 || !diff[i - 1].removed)) {
      changeCount++;
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm leading-relaxed">
        {diff.map((part, index) => {
          if (part.removed) {
            return (
              <span
                key={index}
                className="text-red-600 line-through bg-red-50 px-1 rounded"
              >
                {part.value}
              </span>
            );
          } else if (part.added) {
            return (
              <span
                key={index}
                className="text-green-700 underline decoration-green-700 bg-green-50 px-1 rounded"
              >
                {part.value}
              </span>
            );
          } else {
            return (
              <span key={index} className="text-foreground">
                {part.value}
              </span>
            );
          }
        })}
      </div>
      {changeCount > 0 && (
        <div className="text-xs text-foreground/70 mt-2">
          {changeCount} {changeCount === 1 ? 'change' : 'changes'} detected
        </div>
      )}
    </div>
  );
}

