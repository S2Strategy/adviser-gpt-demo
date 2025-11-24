import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVaultEdits } from "@/hooks/useVaultState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTagTypes } from "@/hooks/useTagTypes";
import { STRATEGIES } from "@/types/vault";
import { migrateStrategyToTags } from "@/utils/tagMigration";
import { parseExcelFile, ParsedExcelRow, ExcelParseResult } from "@/utils/excelParser";
import { TagMappingModal } from "./TagMappingModal";
import { QuestionItem, Tag } from "@/types/vault";
import { Upload, File, X, CornerDownRight, Calendar, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function ExcelQAPair() {
  const { toast } = useToast();
  const { saveManyEdits } = useVaultEdits();
  const { profile } = useUserProfile();
  const { addTagTypeValue } = useTagTypes();
  
  const [strategy, setStrategy] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showTagMapping, setShowTagMapping] = useState(false);
  
  // Column mappings
  const [sectionColumn, setSectionColumn] = useState<string>("");
  const [questionColumn, setQuestionColumn] = useState<string>("");
  const [answerColumn, setAnswerColumn] = useState<string>("");
  const [subQuestionColumn, setSubQuestionColumn] = useState<string>("");
  const [tagValueColumns, setTagValueColumns] = useState<string[]>([]);
  
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
    setUploadedFile(null);
    setParseResult(null);
    setSectionColumn("");
    setQuestionColumn("");
    setAnswerColumn("");
    setSubQuestionColumn("");
    setTagValueColumns([]);
  };

  const handleOpenTagMapping = () => {
    if (!parseResult) return;
    
    // Validate required columns
    if (!sectionColumn || !questionColumn || !answerColumn) {
      toast({
        title: "Missing required columns",
        description: "Please map Section, Question, and Answer columns before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (tagValueColumns.length === 0) {
      toast({
        title: "No tag columns selected",
        description: "Please select at least one column that contains tag values.",
        variant: "destructive",
      });
      return;
    }
    
    setShowTagMapping(true);
  };

  const handleSaveTags = (mappedTags: Record<number, Tag[]>) => {
    if (!parseResult || !strategy) {
      toast({
        title: "Missing information",
        description: "Please ensure strategy is selected and file is parsed.",
        variant: "destructive",
      });
      return;
    }

    // Ensure Strategy tag type exists
    const strategyTagType = "Strategy";
    if (!STRATEGIES.includes(strategy)) {
      addTagTypeValue(strategyTagType, strategy);
    }

    // Create QuestionItem for each row
    const itemsToSave: Array<[string, QuestionItem]> = [];
    const baseTags = migrateStrategyToTags(strategy);

    parseResult.rows.forEach((row, index) => {
      const section = row[sectionColumn] || "";
      const question = String(row[questionColumn] || "").trim();
      const answer = String(row[answerColumn] || "").trim();
      const subQuestion = subQuestionColumn ? String(row[subQuestionColumn] || "").trim() : null;

      if (!question || !answer) {
        return; // Skip rows without required fields
      }

      // Combine base tags (strategy) with mapped tags
      const rowTags = mappedTags[index] || [];
      const allTags: Tag[] = [...baseTags];
      
      // Add mapped tags, avoiding duplicates
      rowTags.forEach((tag) => {
        if (!allTags.some((t) => t.type === tag.type && t.value === tag.value)) {
          allTags.push(tag);
        }
      });

      const newItem: QuestionItem = {
        id: `excel-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        type: "Questionnaires",
        strategy: strategy,
        tags: allTags,
        question: question.trim(),
        answer: answer.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: profile.fullName || "Current User",
        documentTitle: uploadedFile?.name || "Excel Import",
      };

      itemsToSave.push([newItem.id, newItem]);
    });

    if (itemsToSave.length === 0) {
      toast({
        title: "No items to save",
        description: "No valid rows found with question and answer data.",
        variant: "destructive",
      });
      return;
    }

    // Save all items
    saveManyEdits(itemsToSave);

    toast({
      title: "Saved to Vault ✓",
      description: `${itemsToSave.length} question(s) and answer(s) have been saved successfully.`,
    });

    // Reset form
    handleRemoveFile();
    setStrategy("");
    setShowTagMapping(false);
  };

  // Get tag columns (all columns except the mapped ones)
  const getTagColumns = (): string[] => {
    if (!parseResult) return [];
    const mappedColumns = [sectionColumn, questionColumn, answerColumn, subQuestionColumn].filter(Boolean);
    return parseResult.headers.filter((h) => !mappedColumns.includes(h));
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

            {parseResult && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Map Excel Columns</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Section Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={sectionColumn} onValueChange={setSectionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Question Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={questionColumn} onValueChange={setQuestionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Answer Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={answerColumn} onValueChange={setAnswerColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sub-question Column (Optional)</Label>
                      <Select value={subQuestionColumn} onValueChange={setSubQuestionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tag Column Selection */}
                    {sectionColumn && questionColumn && answerColumn && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium">
                            Select Columns with Tag Values (Optional)
                          </Label>
                          <p className="text-xs text-foreground/70 mt-1 mb-3">
                            Choose which columns contain tag values (comma-separated values will be parsed)
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {getTagColumns().map((header) => (
                              <div key={header} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`tag-col-${header}`}
                                  checked={tagValueColumns.includes(header)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setTagValueColumns((prev) => [...prev, header]);
                                    } else {
                                      setTagValueColumns((prev) => prev.filter((h) => h !== header));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`tag-col-${header}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {header}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {getTagColumns().length === 0 && (
                            <p className="text-sm text-foreground/50 italic">
                              All columns have been mapped. No tag columns available.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {sectionColumn && questionColumn && answerColumn && (
                    <div className="flex gap-2">
                      {tagValueColumns.length > 0 && (
                        <Button
                          onClick={handleOpenTagMapping}
                          variant="outline"
                        >
                          Map Tags
                        </Button>
                      )}
                      <Button
                        onClick={() => handleSaveTags({})}
                        className="bg-sidebar-primary hover:bg-sidebar-primary/80"
                      >
                        Save to Vault
                      </Button>
                    </div>
                  )}

                  {/* Preview Cards */}
                  {sectionColumn && questionColumn && answerColumn && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Preview (first 5 rows)</h3>
                      <div className="space-y-4">
                        {parseResult.rows.slice(0, 5).map((row, index) => {
                          const section = String(row[sectionColumn] || "");
                          const question = String(row[questionColumn] || "");
                          const answer = String(row[answerColumn] || "");
                          const subQuestion = subQuestionColumn ? String(row[subQuestionColumn] || "") : null;
                          
                          return (
                            <div
                              key={index}
                              className="border border-foreground/20 rounded-lg bg-background"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between pb-4 border-b border-foreground/20 px-6 py-4">
                                <div className="flex items-center min-w-0 gap-3 flex-1">
                                  <FileText className="h-4 w-4 flex-shrink-0 text-foreground/60" />
                                  <div className="font-bold break-words min-w-0 text-sm" style={{ 
                                    wordBreak: 'break-word',
                                    hyphens: 'auto',
                                    lineHeight: '1.4' 
                                  }}>
                                    {section || uploadedFile?.name || 'Preview Item'}
                                  </div>
                                  <div className="flex items-center gap-1 whitespace-nowrap text-sm">
                                    <Calendar className="h-4 w-4 text-foreground/60" />
                                    <span className="text-foreground/60">Row {index + 1}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Answer Section */}
                              {answer && (
                                <div className="space-y-2 px-6 py-4">
                                  <h4 className="text-xs font-bold leading-5 tracking-tight">Answer</h4>
                                  <div className="bg-foreground/5 rounded-md p-4">
                                    <p className="text-sm leading-relaxed">
                                      {answer.length > 300 ? `${answer.substring(0, 300)}...` : answer}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Question Section */}
                              {question && (
                                <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
                                  <div className="flex items-start gap-2">
                                    <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0 text-foreground/60" />
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold leading-5 tracking-tight">Question</h4>
                                      <p className="text-base font-bold leading-6 tracking-tight">
                                        {question}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Sub-question Section */}
                              {subQuestion && (
                                <div className="space-y-2 px-6 pb-4 ml-6 border-t border-foreground/10 pt-4">
                                  <div className="flex items-start gap-2">
                                    <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0 text-foreground/60" />
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold leading-5 tracking-tight">Sub-question</h4>
                                      <p className="text-sm leading-relaxed">
                                        {subQuestion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TagMappingModal
        open={showTagMapping}
        onClose={() => setShowTagMapping(false)}
        rows={parseResult?.rows || []}
        tagColumns={tagValueColumns}
        onSave={handleSaveTags}
      />
    </div>
  );
}

