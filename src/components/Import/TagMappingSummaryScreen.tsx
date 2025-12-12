import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTagTypes } from "@/hooks/useTagTypes";
import { ImportSession } from "@/types/import";
import { analyzeTagColumn } from "@/utils/tagAnalysis";
import { saveImportSession } from "@/utils/importStorage";
import { parseCommaSeparatedValues, ParsedExcelRow } from "@/utils/excelParser";
import { Loader2 } from "lucide-react";

interface TagMappingSummaryScreenProps {
  session: ImportSession;
  loadParseResult?: (sessionId: string) => ParsedExcelRow[] | null;
  onImport: (updatedSession?: ImportSession) => void;
  onReview: (updatedSession?: ImportSession) => void;
  onSkipTags: (updatedSession?: ImportSession) => void;
}

export function TagMappingSummaryScreen({
  session,
  loadParseResult: externalLoadParseResult,
  onImport,
  onReview,
  onSkipTags,
}: TagMappingSummaryScreenProps) {
  const { toast } = useToast();
  const { tagTypes, getAllTagTypes } = useTagTypes();
  const allTagTypes = getAllTagTypes();
  const [tagColumnTypes, setTagColumnTypes] = useState<Record<string, string>>(() => {
    // Initialize from existing analyses
    const initial: Record<string, string> = {};
    session.columnGuesses.tagColumns.forEach(col => {
      const analysis = session.tagAnalysis[col];
      if (analysis) {
        initial[col] = analysis.tagTypeName;
      }
    });
    return initial;
  });
  const [analyzingColumn, setAnalyzingColumn] = useState<string | null>(null);
  const [localSession, setLocalSession] = useState<ImportSession>(session);

  // Sync with session prop updates
  useEffect(() => {
    setLocalSession(session);
    // Update tagColumnTypes if new analyses appear
    const updated: Record<string, string> = {};
    session.columnGuesses.tagColumns.forEach(col => {
      const analysis = session.tagAnalysis[col];
      if (analysis) {
        updated[col] = analysis.tagTypeName;
      }
    });
    setTagColumnTypes(prev => ({ ...prev, ...updated }));
  }, [session]);

  // Load parseResult from external function or sessionStorage
  const loadParseResult = (): ParsedExcelRow[] | null => {
    const sessionId = session.id;
    if (!sessionId) {
      console.error('Session ID is missing');
      return null;
    }
    
    // Try external loader first (from parent component cache)
    if (externalLoadParseResult) {
      const result = externalLoadParseResult(sessionId);
      if (result) return result;
    }
    
    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem(`import-parseResult-${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.rows || null;
      }
    } catch (error) {
      console.error('Failed to load parseResult from sessionStorage:', error);
    }
    return null;
  };

  const handleTagTypeChange = async (columnName: string, tagTypeName: string) => {
    setTagColumnTypes(prev => ({ ...prev, [columnName]: tagTypeName }));
    
    // Auto-analyze when tag type is selected
    setAnalyzingColumn(columnName);
    
    try {
      const rows = loadParseResult();
      if (!rows) {
        toast({
          title: "Missing file data",
          description: "File data is missing. Please upload the file again.",
          variant: "destructive",
        });
        return;
      }

      // Extract all values from the tag column
      const columnValues: string[] = [];
      rows.forEach((row) => {
        const cellValue = row[columnName];
        if (cellValue) {
          columnValues.push(String(cellValue));
        }
      });

      // Find tag type
      const tagType = tagTypes.find(tt => tt.id === tagTypeName || tt.name === tagTypeName);
      if (!tagType) {
        throw new Error(`Tag type not found: ${tagTypeName}`);
      }

      // Analyze
      const analysisResult = analyzeTagColumn(
        tagType.id,
        tagType.name,
        columnName,
        columnValues,
        allTagTypes
      );

      // Update session - preserve the original session ID
      const updatedSession: ImportSession = {
        ...localSession,
        id: session.id, // Ensure we preserve the original session ID
        tagAnalysis: {
          ...localSession.tagAnalysis,
          [columnName]: analysisResult,
        },
        status: 'tags_analyzed',
      };

      // Update local state immediately so UI reflects the change
      setLocalSession(updatedSession);

      try {
        saveImportSession(updatedSession);
      } catch (error) {
        console.warn('Failed to save session:', error);
      }
      
      toast({
        title: "Tag analysis complete ✓",
        description: `Found ${analysisResult.stats.uniqueCount} unique values in ${columnName}.`,
      });
    } catch (error) {
      toast({
        title: "Error analyzing tags",
        description: error instanceof Error ? error.message : "Failed to analyze tag column.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingColumn(null);
    }
  };

  const handleImport = () => {
    // Check if all tag columns have been analyzed
    const unanalyzedColumns = localSession.columnGuesses.tagColumns.filter(
      col => !localSession.tagAnalysis[col]
    );
    
    if (unanalyzedColumns.length > 0) {
      toast({
        title: "Analysis incomplete",
        description: `Please select label types for: ${unanalyzedColumns.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Get latest session state
    const latestSession = { ...localSession, status: 'tags_analyzed' as const };
    try {
      saveImportSession(latestSession);
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
    onImport(latestSession);
  };

  // Calculate total stats across all analyzed columns
  const totalStats = (() => {
    let totalUnique = 0;
    let totalMatched = 0;
    let totalUnmatched = 0;
    
    localSession.columnGuesses.tagColumns.forEach(col => {
      const analysis = localSession.tagAnalysis[col];
      if (analysis) {
        totalUnique += analysis.stats.uniqueCount;
        totalMatched += analysis.stats.matchedCount;
        totalUnmatched += analysis.stats.unmatchedCount;
      }
    });
    
    return { totalUnique, totalMatched, totalUnmatched };
  })();

  if (localSession.columnGuesses.tagColumns.length === 0) {
    // No tag columns selected, show skip option
    return (
      <div className="space-y-6">
        <div className="p-4 bg-sidebar-background rounded-lg border border-foreground/10">
          <p className="text-sm text-foreground/70">
            No tag columns were selected. You can import the Q&A pairs without tags, or go back to add tag columns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onSkipTags()}
            className="bg-sidebar-primary hover:bg-sidebar-primary/80"
          >
            Import without tags
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tag Column & Type Selection for each column */}
      <div className="space-y-4">
        <div>
          <Label>What kind of label is each tag column?</Label>
          <p className="text-xs text-foreground/60 mt-1">
            Select a label type for each tag column to analyze values
          </p>
        </div>
        
        {localSession.columnGuesses.tagColumns.map((columnName) => {
          const analysis = localSession.tagAnalysis[columnName];
          const isAnalyzing = analyzingColumn === columnName;
          const selectedTagType = tagColumnTypes[columnName] || "";
          
          return (
            <div key={columnName} className="p-4 border border-foreground/10 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{columnName}</Label>
                {analysis && (
                  <span className="text-xs text-foreground/60">
                    {analysis.stats.uniqueCount} unique values
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label Type</Label>
                  <Select
                    value={selectedTagType}
                    onValueChange={(tagTypeName) => handleTagTypeChange(columnName, tagTypeName)}
                    disabled={isAnalyzing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select label type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tagTypes.map((tt) => (
                        <SelectItem key={tt.id} value={tt.name}>
                          {tt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {isAnalyzing && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-foreground/70">Analyzing...</span>
                  </div>
                )}
              </div>
              
              {/* Analysis Summary for this column */}
              {analysis && !isAnalyzing && (
                <div className="p-3 bg-sidebar-background rounded-md border border-foreground/10">
                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                    <span>• {analysis.stats.matchedCount} match existing {analysis.tagTypeName} labels</span>
                    <span>• {analysis.stats.unmatchedCount} will be created as new {analysis.tagTypeName} labels</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Summary Bar */}
      {totalStats.totalUnique > 0 && (
        <div className="p-4 bg-sidebar-background rounded-lg border border-foreground/10">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {totalStats.totalUnique} unique values found across all tag columns
            </p>
            <div className="flex items-center gap-4 text-sm text-foreground/70">
              <span>• {totalStats.totalMatched} match existing labels</span>
              <span>• {totalStats.totalUnmatched} will be created as new labels</span>
            </div>
            <p className="text-xs text-foreground/60 mt-2">
              We matched as many labels as we could. You can import now, or review the values we don't recognize yet.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {totalStats.totalUnique > 0 && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleImport()}
            className="bg-sidebar-primary hover:bg-sidebar-primary/80 w-full"
            size="lg"
            disabled={analyzingColumn !== null}
          >
            Import now (fastest)
          </Button>
          <p className="text-xs text-foreground/60 text-center">
            Use these mappings and create new labels where needed
          </p>
          
          {totalStats.totalUnmatched > 0 && (
            <Button
              onClick={() => {
                const latestSession = { ...localSession, status: 'tags_analyzed' as const };
                try {
                  saveImportSession(latestSession);
                } catch (error) {
                  console.warn('Failed to save session:', error);
                }
                onReview(latestSession);
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Review unmatched values ({totalStats.totalUnmatched})
            </Button>
          )}
          
          <Button
            onClick={() => {
              const latestSession = { ...localSession, status: 'tags_analyzed' as const };
              try {
                saveImportSession(latestSession);
              } catch (error) {
                console.warn('Failed to save session:', error);
              }
              onSkipTags(latestSession);
            }}
            variant="ghost"
            className="w-full"
          >
            Skip tags for now
          </Button>
        </div>
      )}
    </div>
  );
}

