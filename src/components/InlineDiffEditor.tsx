import React, { useRef, useEffect, useState } from 'react';
import { diffWords } from 'diff';

interface InlineDiffEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  originalContent: string;
  updatedContent: string | null;
  hasPendingDiffs: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function InlineDiffEditor({
  content,
  onContentChange,
  originalContent,
  updatedContent,
  hasPendingDiffs,
  disabled = false,
  placeholder = "Your draft will appear here...",
}: InlineDiffEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Determine what content to display
  // When there are pending diffs, show current content (which may include manual edits)
  // When no diffs, show content
  const displayContent = content;

  // Handle content changes from user edits
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setIsEditing(true);
    onContentChange(newContent);
  };

  // Handle paste to strip formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    // Trigger input event
    const event = new Event('input', { bubbles: true });
    editorRef.current?.dispatchEvent(event);
  };

  // Render HTML with diff styling
  // When there are pending diffs, show diff between originalContent and current content
  // This includes both AI changes and any manual edits
  const renderDiffHTML = () => {
    if (!hasPendingDiffs || isEditing || isFocused) {
      return null;
    }

    // Calculate diff between original baseline and current content (which may include edits)
    const diff = diffWords(originalContent, displayContent);
    let html = '';
    
    diff.forEach((part) => {
      const escaped = part.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      
      if (part.removed) {
        html += `<span class="text-red-600 line-through bg-red-50 px-1 rounded">${escaped}</span>`;
      } else if (part.added) {
        html += `<span class="text-green-700 underline decoration-green-700 bg-green-50 px-1 rounded">${escaped}</span>`;
      } else {
        html += `<span class="text-foreground">${escaped}</span>`;
      }
    });
    
    return html;
  };

  // Update editor content when props change
  useEffect(() => {
    if (!editorRef.current) return;

    // If user is actively editing, don't update
    if (isEditing && isFocused) {
      return;
    }

    const diffHTML = renderDiffHTML();
    
    if (diffHTML !== null && diffHTML !== '') {
      // Show diff view
      editorRef.current.innerHTML = diffHTML;
    } else {
      // Show plain text
      const currentText = editorRef.current.textContent || '';
      const newText = displayContent || '';
      if (currentText !== newText) {
        editorRef.current.textContent = newText || placeholder;
      }
    }
  }, [hasPendingDiffs, originalContent, displayContent, placeholder, isEditing, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show current content for editing
    if (editorRef.current) {
      const currentText = editorRef.current.textContent || '';
      const newText = displayContent || '';
      if (currentText !== newText) {
        editorRef.current.textContent = newText;
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Reset editing state after a short delay to allow for re-render with diff
    setTimeout(() => {
      setIsEditing(false);
    }, 150);
  };

  const isEmpty = !displayContent.trim();

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`
          min-h-[400px] 
          resize-none 
          font-mono 
          text-sm 
          leading-relaxed
          p-4
          border 
          border-foreground/10 
          rounded-lg
          focus:outline-none 
          focus:ring-2 
          focus:ring-primary 
          focus:border-transparent
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}
          ${isEmpty && !isFocused ? 'text-foreground/50' : 'text-foreground'}
          whitespace-pre-wrap
        `}
      />
      {isEmpty && !isFocused && (
        <div className="absolute top-4 left-4 text-foreground/50 pointer-events-none font-mono text-sm">
          {placeholder}
        </div>
      )}
    </div>
  );
}
