import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useVaultEdits } from "@/hooks/useVaultState";
import { useTagTypes } from "@/hooks/useTagTypes";
import { ImportSession, ImportSummary } from "@/types/import";
import { saveImportSession, loadActiveImportSession } from "@/utils/importStorage";
import { executeImport } from "@/utils/importExecution";
import { ParsedExcelRow } from "@/utils/excelParser";
import { ImportUploadScreen } from "./ImportUploadScreen";
import { TagMappingSummaryScreen } from "./TagMappingSummaryScreen";
import { TagMappingDetailTable } from "./TagMappingDetailTable";
import { ImportResultScreen } from "./ImportResultScreen";
import { ImportProgressStepper } from "./ImportProgressStepper";

type ImportScreen = 'upload' | 'tags' | 'review' | 'result';

export function ImportFlow() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveManyEdits, getEdit, clearEdit } = useVaultEdits();
  const { addTagTypeValue } = useTagTypes();
  
  const [currentScreen, setCurrentScreen] = useState<ImportScreen>('upload');
  const [session, setSession] = useState<ImportSession | null>(loadActiveImportSession());
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [parseResultCache, setParseResultCache] = useState<Record<string, ParsedExcelRow[]>>({});

  const handleUploadContinue = (updatedSession: ImportSession, parseResult?: ParsedExcelRow[]) => {
    setSession(updatedSession);
    // Cache parseResult in component state if provided
    if (parseResult && updatedSession.id) {
      setParseResultCache(prev => ({ ...prev, [updatedSession.id]: parseResult }));
    }
    if (updatedSession.columnGuesses.tagColumns.length > 0) {
      setCurrentScreen('tags');
    } else {
      // No tag columns, skip to import
      handleSkipTags(updatedSession);
    }
  };

  // Helper to load parseResult from cache or sessionStorage
  const loadParseResult = (sessionId: string): ParsedExcelRow[] | null => {
    // First try component state cache
    if (parseResultCache[sessionId]) {
      return parseResultCache[sessionId];
    }
    
    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem(`import-parseResult-${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const rows = parsed.rows || null;
        // Cache it for future use
        if (rows) {
          setParseResultCache(prev => ({ ...prev, [sessionId]: rows }));
        }
        return rows;
      }
    } catch (error) {
      console.error('Failed to load parseResult from sessionStorage:', error);
    }
    return null;
  };

  const handleImport = (updatedSession?: ImportSession) => {
    const activeSession = updatedSession || session;
    if (!activeSession) {
      toast({
        title: "Missing data",
        description: "Session data is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // Load parseResult from sessionStorage
    const rows = loadParseResult(activeSession.id);
    if (!rows) {
      toast({
        title: "Missing file data",
        description: "File data is missing. Please upload the file again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const importSummary = executeImport(
        activeSession,
        rows,
        saveManyEdits,
        addTagTypeValue
      );

      // Update session with summary
      const completedSession: ImportSession = {
        ...activeSession,
        summary: importSummary,
        status: 'imported',
      };
      try {
        saveImportSession(completedSession);
      } catch (error) {
        console.warn('Failed to save completed session:', error);
      }
      setSession(completedSession);
      setSummary(importSummary);
      setCurrentScreen('result');

      toast({
        title: "Import complete ✓",
        description: `Successfully imported ${importSummary.rowsImported} Q&A pairs.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to execute import.",
        variant: "destructive",
      });
    }
  };

  const handleSkipTags = (sessionToUse?: ImportSession) => {
    const activeSession = sessionToUse || session;
    if (!activeSession) {
      toast({
        title: "Missing data",
        description: "Session data is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // Load parseResult from sessionStorage
    const rows = loadParseResult(activeSession.id);
    if (!rows) {
      toast({
        title: "Missing file data",
        description: "File data is missing. Please upload the file again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Execute import without tags
      const importSummary = executeImport(
        { ...activeSession, tagAnalysis: {} },
        rows,
        saveManyEdits,
        addTagTypeValue
      );

      const completedSession: ImportSession = {
        ...activeSession,
        summary: importSummary,
        status: 'imported',
      };
      saveImportSession(completedSession);
      setSession(completedSession);
      setSummary(importSummary);
      setCurrentScreen('result');

      toast({
        title: "Import complete ✓",
        description: `Successfully imported ${importSummary.rowsImported} Q&A pairs.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to execute import.",
        variant: "destructive",
      });
    }
  };

  const handleReview = (updatedSession?: ImportSession) => {
    if (updatedSession) {
      setSession(updatedSession);
      try {
        saveImportSession(updatedSession);
      } catch (error) {
        console.warn('Failed to save session:', error);
      }
    }
    setCurrentScreen('review');
  };

  const handleUndo = () => {
    setCurrentScreen('upload');
    setSession(null);
    setSummary(null);
  };

  if (!session && currentScreen !== 'upload') {
    // If we don't have a session but we're not on upload screen, go back to upload
    setCurrentScreen('upload');
    return null;
  }

  return (
    <div className="space-y-6">
      <ImportProgressStepper currentStep={currentScreen} />
      
      {currentScreen === 'upload' && (
        <ImportUploadScreen onContinue={handleUploadContinue} />
      )}
      
      {currentScreen === 'tags' && session && (
        <TagMappingSummaryScreen
          session={session}
          loadParseResult={loadParseResult}
          onImport={handleImport}
          onReview={handleReview}
          onSkipTags={handleSkipTags}
        />
      )}
      
      {currentScreen === 'review' && session && (
        <TagMappingDetailTable
          session={session}
          onSaveAndImport={handleImport}
          onCancel={() => setCurrentScreen('tags')}
        />
      )}
      
      {currentScreen === 'result' && session && summary && (
        <ImportResultScreen
          session={session}
          summary={summary}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}

