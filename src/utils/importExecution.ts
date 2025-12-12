import { ImportSession, ImportSummary } from '@/types/import';
import { ParsedExcelRow } from './excelParser';
import { QuestionItem, Tag } from '@/types/vault';
import { migrateStrategyToTags } from './tagMigration';
import { parseCommaSeparatedValues } from './excelParser';

/**
 * Execute an import session, creating Q&A items and tags
 */
export function executeImport(
  session: ImportSession,
  rows: ParsedExcelRow[],
  saveManyEdits: (entries: Array<[string, QuestionItem]>) => void,
  addTagTypeValue: (tagTypeName: string, value: string) => boolean
): ImportSummary {
  const { columnGuesses, tagAnalysis, strategy } = session;
  const { section, question, answer, subQuestion } = columnGuesses;
  
  if (!section || !question || !answer) {
    throw new Error('Required columns (section, question, answer) must be set');
  }
  
  const itemsToSave: Array<[string, QuestionItem]> = [];
  const createdTagValues: Array<{ tagType: string; value: string }> = [];
  const tagsByType: Record<string, { existingUsed: Set<string>; newCreated: Set<string> }> = {};
  
  // Group rows by section
  const sectionGroups = new Map<string, ParsedExcelRow[]>();
  rows.forEach(row => {
    const sectionValue = String(row[section] || '').trim() || 'Uncategorized';
    if (!sectionGroups.has(sectionValue)) {
      sectionGroups.set(sectionValue, []);
    }
    sectionGroups.get(sectionValue)!.push(row);
  });
  
  // Process each section group
  let globalRowIndex = 0;
  sectionGroups.forEach((sectionRows, sectionTitle) => {
    const sectionDocumentId = `section-${session.id}-${sectionTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    
    // Process each row in this section
    sectionRows.forEach((row, sectionRowIndex) => {
      const questionValue = String(row[question] || '').trim();
      const answerValue = String(row[answer] || '').trim();
      const subQuestionValue = subQuestion ? String(row[subQuestion] || '').trim() : null;
      
      // Skip rows without required fields
      if (!questionValue || !answerValue) {
        return;
      }
      
      // Collect all tags for this row
      const tags: Tag[] = [];
      
      // Add strategy tag
      const strategyTags = migrateStrategyToTags(strategy);
      tags.push(...strategyTags);
      
      // Process each tag column
      columnGuesses.tagColumns.forEach(columnName => {
        const analysis = tagAnalysis[columnName];
        if (!analysis) return;
        
        const cellValue = row[columnName];
        if (!cellValue) return;
        
        // Parse comma-separated values
        const parsedValues = parseCommaSeparatedValues(cellValue);
        
        parsedValues.forEach(sourceValue => {
          const trimmed = sourceValue.trim();
          if (!trimmed) return;
          
          // Find the mapping for this value
          const mapping = analysis.mappings.find(m => m.sourceValue === trimmed);
          if (!mapping) return;
          
          // Determine the tag value to use
          const tagValue = mapping.mappedTagName || trimmed;
          
          // Track tag usage
          if (!tagsByType[analysis.tagTypeName]) {
            tagsByType[analysis.tagTypeName] = {
              existingUsed: new Set(),
              newCreated: new Set(),
            };
          }
          
          if (mapping.status === 'matched') {
            // Use existing tag
            tagsByType[analysis.tagTypeName].existingUsed.add(tagValue);
            tags.push({
              type: analysis.tagTypeName,
              value: tagValue,
            });
          } else {
            // Create new tag
            const success = addTagTypeValue(analysis.tagTypeName, tagValue);
            if (success) {
              tagsByType[analysis.tagTypeName].newCreated.add(tagValue);
              createdTagValues.push({
                tagType: analysis.tagTypeName,
                value: tagValue,
              });
              tags.push({
                type: analysis.tagTypeName,
                value: tagValue,
              });
            }
          }
        });
      });
      
      // Create QuestionItem with section-based structure
      const itemId = `${sectionDocumentId}-${sectionRowIndex + 1}`;
      const finalQuestion = subQuestionValue ? `${questionValue} (${subQuestionValue})` : questionValue;
      
      const item: QuestionItem = {
        id: itemId,
        type: 'Questionnaires',
        question: finalQuestion,
        answer: answerValue,
        tags,
        updatedAt: new Date().toISOString(),
        updatedBy: session.fileMetadata.uploadedBy,
        documentTitle: sectionTitle, // Section value becomes document title
        documentId: sectionDocumentId,
      };
      
      itemsToSave.push([itemId, item]);
      globalRowIndex++;
    });
  });
  
  // Save all items
  if (itemsToSave.length > 0) {
    saveManyEdits(itemsToSave);
  }
  
  // Convert sets to counts for summary
  const tagsByTypeSummary: Record<string, { existingUsed: number; newCreated: number }> = {};
  Object.keys(tagsByType).forEach(tagType => {
    tagsByTypeSummary[tagType] = {
      existingUsed: tagsByType[tagType].existingUsed.size,
      newCreated: tagsByType[tagType].newCreated.size,
    };
  });
  
  return {
    rowsImported: itemsToSave.length,
    tagsByType: tagsByTypeSummary,
    importedItemIds: itemsToSave.map(([id]) => id),
    createdTagValues,
  };
}

/**
 * Rollback an import by removing imported items
 */
export function rollbackImport(
  sessionId: string,
  importedItemIds: string[],
  getEdit: (id: string) => any,
  clearEdit: (id: string) => void
): void {
  // Remove all items that were imported in this session
  importedItemIds.forEach(itemId => {
    const item = getEdit(itemId);
    if (item && item.documentId === sessionId) {
      clearEdit(itemId);
    }
  });
}

