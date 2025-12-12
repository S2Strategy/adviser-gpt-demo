import { ImportSession } from '@/types/import';

const STORAGE_KEY = 'ag_import_sessions';
const ACTIVE_SESSION_KEY = 'ag_active_import_session';

/**
 * Clean up old sessions to prevent quota issues
 */
function cleanupOldSessions(sessions: ImportSession[]): ImportSession[] {
  // Keep only the last 10 sessions, sorted by uploadedAt
  const sorted = sessions.sort((a, b) => 
    new Date(b.fileMetadata.uploadedAt).getTime() - new Date(a.fileMetadata.uploadedAt).getTime()
  );
  return sorted.slice(0, 10);
}

/**
 * Save an import session to localStorage
 */
export function saveImportSession(session: ImportSession): void {
  try {
    const existing = loadAllImportSessions();
    const index = existing.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      existing[index] = session;
    } else {
      existing.push(session);
    }
    
    // Clean up old sessions before saving
    const cleaned = cleanupOldSessions(existing);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    localStorage.setItem(ACTIVE_SESSION_KEY, session.id);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Try cleaning up more aggressively
      try {
        const existing = loadAllImportSessions();
        const cleaned = cleanupOldSessions(existing).slice(0, 5); // Keep only 5
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        localStorage.setItem(ACTIVE_SESSION_KEY, session.id);
      } catch (retryError) {
        console.error('Failed to save import session after cleanup:', retryError);
        throw new Error('Storage quota exceeded. Please clear some data and try again.');
      }
    } else {
      console.error('Failed to save import session:', error);
      throw error;
    }
  }
}

/**
 * Load an import session by ID
 */
export function loadImportSession(sessionId: string): ImportSession | null {
  try {
    const all = loadAllImportSessions();
    return all.find(s => s.id === sessionId) || null;
  } catch (error) {
    console.error('Failed to load import session:', error);
    return null;
  }
}

/**
 * Load the active import session
 */
export function loadActiveImportSession(): ImportSession | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!activeId) return null;
    return loadImportSession(activeId);
  } catch (error) {
    console.error('Failed to load active import session:', error);
    return null;
  }
}

/**
 * Load all import sessions
 */
export function loadAllImportSessions(): ImportSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ImportSession[];
  } catch (error) {
    console.error('Failed to load import sessions:', error);
    return [];
  }
}

/**
 * Delete an import session
 */
export function deleteImportSession(sessionId: string): void {
  try {
    const all = loadAllImportSessions();
    const filtered = all.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (activeId === sessionId) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (error) {
    console.error('Failed to delete import session:', error);
  }
}

/**
 * Create a new import session
 */
export function createImportSession(
  strategy: string | undefined,
  file: File,
  uploadedBy: string,
  parseResult?: { headers: string[]; rows: any[]; sheetName: string }
): ImportSession {
  const session: ImportSession = {
    id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...(strategy && { strategy }),
    fileMetadata: {
      filename: file.name,
      size: file.size,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    },
    columnGuesses: {
      section: null,
      question: null,
      answer: null,
      subQuestion: null,
      tagColumns: [],
    },
    tagAnalysis: {},
    status: 'uploaded',
    parseResultMetadata: parseResult ? {
      headers: parseResult.headers,
      rowCount: parseResult.rows.length,
      sheetName: parseResult.sheetName,
    } : undefined,
  };
  
  try {
    saveImportSession(session);
  } catch (error) {
    console.error('Failed to save import session:', error);
    // Still return the session even if save fails
  }
  return session;
}

