import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { STRATEGIES } from "@/types/vault";
import { parseExcelFile, ParsedExcelRow, ExcelParseResult } from "@/utils/excelParser";
import { detectColumnsFromExcel } from "@/utils/columnDetection";
import { createImportSession, saveImportSession } from "@/utils/importStorage";
import { ImportSession } from "@/types/import";
import { Upload, File, X, Plus } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionItem, Tag } from "@/types/vault";
import { migrateStrategyToTags } from "@/utils/tagMigration";

interface ImportUploadScreenProps {
  onContinue: (session: ImportSession, parseResult?: ParsedExcelRow[]) => void;
}

export function ImportUploadScreen({ onContinue }: ImportUploadScreenProps) {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  
  const [strategy, setStrategy] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [session, setSession] = useState<ImportSession | null>(null);
  
  // Column mappings
  const [sectionColumn, setSectionColumn] = useState<string>("");
  const [questionColumn, setQuestionColumn] = useState<string>("");
  const [answerColumn, setAnswerColumn] = useState<string>("");
  const [subQuestionColumn, setSubQuestionColumn] = useState<string>("");
  const [tagColumns, setTagColumns] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = ['.csv', '.xlsx', '.xls'];

    if (!acceptedTypes.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV, XLSX, or XLS files only.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsParsing(true);

    try {
      const result = await parseExcelFile(file);
      setParseResult(result);
      
      // Clean up old parseResults from sessionStorage first
      try {
        const allKeys = Object.keys(sessionStorage);
        const parseResultKeys = allKeys.filter(k => k.startsWith('import-parseResult-'));
        // Keep only the last 2 parseResults, delete older ones
        if (parseResultKeys.length >= 2) {
          // Sort by timestamp (extracted from key) and remove oldest
          const sortedKeys = parseResultKeys.sort();
          // Remove all but the most recent 2
          for (let i = 0; i < sortedKeys.length - 2; i++) {
            sessionStorage.removeItem(sortedKeys[i]);
          }
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup old parseResults:', cleanupError);
      }
      
      // Store full parseResult in sessionStorage (not localStorage to avoid quota issues)
      const sessionId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        const serialized = JSON.stringify(result);
        sessionStorage.setItem(`import-parseResult-${sessionId}`, serialized);
      } catch (storageError) {
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          // If still too large, try to clean up more aggressively
          try {
            const allKeys = Object.keys(sessionStorage);
            const parseResultKeys = allKeys.filter(k => k.startsWith('import-parseResult-'));
            // Delete all old parseResults
            parseResultKeys.forEach(key => sessionStorage.removeItem(key));
            // Try again
            sessionStorage.setItem(`import-parseResult-${sessionId}`, JSON.stringify(result));
          } catch (retryError) {
            console.error('Failed to store parseResult even after cleanup:', retryError);
            toast({
              title: "File too large",
              description: "The file is too large to process. Please try a smaller file or split it into multiple files.",
              variant: "destructive",
            });
            setUploadedFile(null);
            setParseResult(null);
            setIsParsing(false);
            return;
          }
        } else {
          console.warn('Failed to store parseResult in sessionStorage:', storageError);
        }
      }
      
      // Detect columns
      const guesses = detectColumnsFromExcel(result.headers);
      
      // Create import session (only stores metadata, not full rows)
      const newSession = createImportSession(
        strategy,
        file,
        profile.fullName || "Current User",
        result
      );
      
      // Set session ID for sessionStorage lookup
      newSession.id = sessionId;
      
      // Set guessed columns
      newSession.columnGuesses = guesses;
      newSession.status = 'uploaded';
      
      try {
        saveImportSession(newSession);
      } catch (storageError) {
        toast({
          title: "Storage warning",
          description: "File parsed but couldn't save session. Please continue quickly.",
          variant: "destructive",
        });
      }
      setSession(newSession);
      
      // Set initial column selections
      setSectionColumn(guesses.section || "");
      setQuestionColumn(guesses.question || "");
      setAnswerColumn(guesses.answer || "");
      setSubQuestionColumn(guesses.subQuestion || "");
      setTagColumns(guesses.tagColumns || []);
      
      toast({
        title: "File parsed successfully ✓",
        description: `Found ${result.rows.length} rows with ${result.headers.length} columns.`,
      });
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse Excel file.",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = () => {
    // Clean up sessionStorage
    if (session?.id) {
      try {
        sessionStorage.removeItem(`import-parseResult-${session.id}`);
      } catch (e) {
        // Ignore
      }
    }
    setUploadedFile(null);
    setParseResult(null);
    setSession(null);
    setSectionColumn("");
    setQuestionColumn("");
    setAnswerColumn("");
    setSubQuestionColumn("");
    setTagColumns([]);
  };

  const handleAddTagColumn = () => {
    if (!parseResult) return;
    const availableColumns = parseResult.headers.filter(
      h => h !== sectionColumn && h !== questionColumn && h !== answerColumn && h !== subQuestionColumn && !tagColumns.includes(h)
    );
    if (availableColumns.length > 0) {
      setTagColumns([...tagColumns, availableColumns[0]]);
    }
  };

  const handleRemoveTagColumn = (column: string) => {
    setTagColumns(tagColumns.filter(c => c !== column));
  };

  const handleContinue = () => {
    if (!session || !sectionColumn || !questionColumn || !answerColumn) {
      toast({
        title: "Missing required columns",
        description: "Please map Section, Question, and Answer columns before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Update session with confirmed columns
    const updatedSession: ImportSession = {
      ...session,
      columnGuesses: {
        section: sectionColumn,
        question: questionColumn,
        answer: answerColumn,
        subQuestion: subQuestionColumn || null,
        tagColumns,
      },
      status: 'columns_confirmed',
    };
    
    try {
      saveImportSession(updatedSession);
    } catch (error) {
      toast({
        title: "Storage warning",
        description: "Couldn't save session, but continuing anyway.",
        variant: "destructive",
      });
    }
    setSession(updatedSession);
    
    // Pass parseResult to parent so it can cache it
    onContinue(updatedSession, parseResult?.rows || undefined);
  };

  const getAvailableColumns = (excludeColumns: string[]) => {
    if (!parseResult) return [];
    return parseResult.headers
      .filter(h => h && h.trim() !== "") // Filter out empty strings
      .filter(h => !excludeColumns.includes(h));
  };

  // Create preview QuestionItem from first row
  const previewItem: QuestionItem | null = (() => {
    if (!parseResult || !sectionColumn || !questionColumn || !answerColumn) return null;
    const firstRow = parseResult.rows[0];
    if (!firstRow) return null;
    
    const section = String(firstRow[sectionColumn] || "").trim();
    const question = String(firstRow[questionColumn] || "").trim();
    const answer = String(firstRow[answerColumn] || "").trim();
    const subQuestion = subQuestionColumn ? String(firstRow[subQuestionColumn] || "").trim() : null;
    
    if (!question || !answer) return null;
    
    // Collect tags from tag columns
    const tags: Tag[] = [];
    tagColumns.forEach(col => {
      const cellValue = firstRow[col];
      if (cellValue) {
        const values = String(cellValue).split(',').map(v => v.trim()).filter(Boolean);
        values.forEach(val => {
          tags.push({ type: 'Category', value: val }); // Default type for preview
        });
      }
    });
    
    return {
      id: 'preview-1',
      type: 'Questionnaires',
      question: subQuestion ? `${question} (${subQuestion})` : question,
      answer,
      ...(strategy && { strategy }),
      tags: [...migrateStrategyToTags(strategy), ...tags],
      updatedAt: new Date().toISOString(),
      updatedBy: profile.fullName || "Current User",
      documentTitle: section || "Preview Section",
    };
  })();

  return (
    <div className="space-y-6">
      {/* Strategy Selection
      <div className="space-y-2">
        <Label htmlFor="strategy">
          Strategy
        </Label>
        <Select value={strategy} onValueChange={setStrategy} disabled={!!uploadedFile}>
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
      </div> */}

      {/* File Upload */}
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-sidebar-primary bg-sidebar-primary/10'
              : 'border-foreground/20 hover:border-foreground/40'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
          <p className="text-sm text-foreground/70 mb-2">
            Drag and drop your Excel file here, or
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
          >
            {isParsing ? "Parsing..." : "Select File"}
          </Button>
          <p className="text-xs text-foreground/50 mt-2">
            CSV, XLSX, or XLS files only
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-3 border border-foreground/10 rounded-lg">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-foreground/70" />
              <span className="text-sm">{uploadedFile.name}</span>
              <span className="text-xs text-foreground/50">
                ({(uploadedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Column Mapping */}
          {parseResult && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Map Excel Columns</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Section <span className="text-destructive">*</span>
                    </Label>
                    <Select value={sectionColumn} onValueChange={setSectionColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColumns([questionColumn, answerColumn, subQuestionColumn, ...tagColumns]).map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Question <span className="text-destructive">*</span>
                    </Label>
                    <Select value={questionColumn} onValueChange={setQuestionColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColumns([sectionColumn, answerColumn, subQuestionColumn, ...tagColumns]).map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Answer <span className="text-destructive">*</span>
                    </Label>
                    <Select value={answerColumn} onValueChange={setAnswerColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColumns([sectionColumn, questionColumn, subQuestionColumn, ...tagColumns]).map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Sub-question Column (Optional) */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Sub-question (Optional)</Label>
                    {subQuestionColumn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSubQuestionColumn("")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <Select 
                    value={subQuestionColumn || undefined} 
                    onValueChange={(value) => setSubQuestionColumn(value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableColumns([sectionColumn, questionColumn, answerColumn, ...tagColumns]).map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tag Columns */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tag Columns (Optional)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTagColumn}
                    disabled={getAvailableColumns([sectionColumn, questionColumn, answerColumn, subQuestionColumn, ...tagColumns]).length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag Column
                  </Button>
                </div>
                {tagColumns.map((column) => (
                  <div key={column} className="flex items-center gap-2">
                    <Select
                      value={column}
                      onValueChange={(newColumn) => {
                        setTagColumns(tagColumns.map(c => c === column ? newColumn : c));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColumns([sectionColumn, questionColumn, answerColumn, subQuestionColumn, ...tagColumns.filter(c => c !== column)]).map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTagColumn(column)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Preview QuestionCard */}
              {previewItem && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <p className="text-xs text-foreground/60">
                    This is how the first row will appear in your Vault
                  </p>
                  <QuestionCard
                    item={previewItem}
                    formatRelativeTime={(date) => "just now"}
                    formatFullDate={(date) => new Date(date).toLocaleString()}
                    highlightSearchTerms={(text) => text}
                  />
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleContinue}
                  disabled={!sectionColumn || !questionColumn || !answerColumn}
                  className="bg-sidebar-primary hover:bg-sidebar-primary/80"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

