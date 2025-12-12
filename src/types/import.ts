// Import Session Types

export interface ImportSession {
  id: string;
  strategy?: string;
  fileMetadata: {
    filename: string;
    size: number;
    uploadedBy: string;
    uploadedAt: string;
  };
  columnGuesses: {
    section: string | null;
    question: string | null;
    answer: string | null;
    subQuestion: string | null;
    tagColumns: string[];
  };
  tagAnalysis: Record<string, TagColumnAnalysis>; // key: columnName
  status: 'uploaded' | 'columns_confirmed' | 'tags_analyzed' | 'imported' | 'rolled_back';
  summary?: ImportSummary;
  parseResultMetadata?: {
    headers: string[];
    rowCount: number;
    sheetName: string;
  };
}

export interface TagColumnAnalysis {
  tagTypeId: string;
  tagTypeName: string;
  columnName: string;
  stats: {
    uniqueCount: number;
    matchedCount: number;
    unmatchedCount: number;
  };
  mappings: TagMapping[];
}

export interface TagMapping {
  sourceValue: string;
  status: 'matched' | 'new';
  existingTagId?: string;
  existingTagName?: string;
  mappedTagId?: string;
  mappedTagName?: string;
}

export interface ImportSummary {
  rowsImported: number;
  tagsByType: Record<string, { existingUsed: number; newCreated: number }>;
  importedItemIds: string[];
  createdTagValues: Array<{ tagType: string; value: string }>;
}

export interface ColumnGuesses {
  section: string | null;
  question: string | null;
  answer: string | null;
  subQuestion: string | null;
  tagColumns: string[];
}

