import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HIGHLIGHT_COLORS, getSourceNumberColor } from '@/lib/colors';
import { Source } from '@/hooks/useChatResults';


interface TextSegment {
  text: string;
}

interface SourceHighlightedTextProps {
  text: string;
}

export function SourceHighlightedText({ text }: SourceHighlightedTextProps) {
  // Parse the text
  const parseText = (text: string) => {
    const segments: TextSegment[] = [];
    
    // Split by sentences and analyze each
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    sentences.forEach((sentence) => {
      segments.push({
        text: sentence,
      });
    });
    
    
    return segments;
  };
  
  const textSegments = parseText(text);
  
  
  return (
    <span>
      {textSegments.map((segment, index) => {
        
        // Vault source content
          return (
            <span key={index} className="mr-1 leading-6 transition-colors">{segment.text}</span>
          );
        })}
    </span>
  );
}
