import { TagType } from '@/types/vault';
import { TagColumnAnalysis, TagMapping } from '@/types/import';
import { parseCommaSeparatedValues } from './excelParser';

/**
 * Analyze a tag column and create mappings
 */
export function analyzeTagColumn(
  tagTypeId: string,
  tagTypeName: string,
  columnName: string,
  columnValues: string[],
  allTagTypes: TagType[]
): TagColumnAnalysis {
  // Get the tag type we're analyzing
  const tagType = allTagTypes.find(tt => tt.id === tagTypeId || tt.name === tagTypeName);
  if (!tagType) {
    throw new Error(`Tag type ${tagTypeName} not found`);
  }
  
  // Extract all unique values from the column (handling comma-separated values)
  const uniqueValues = new Set<string>();
  columnValues.forEach(value => {
    if (value) {
      const parsed = parseCommaSeparatedValues(value);
      parsed.forEach(v => {
        const trimmed = v.trim();
        if (trimmed) {
          uniqueValues.add(trimmed);
        }
      });
    }
  });
  
  const uniqueValuesArray = Array.from(uniqueValues);
  
  // Create mappings
  const mappings: TagMapping[] = uniqueValuesArray.map(sourceValue => {
    const normalizedSource = sourceValue.toLowerCase().trim();
    
    // Try to find a match in existing tag values (case-insensitive)
    const matchedValue = tagType.values.find(existingValue => 
      existingValue.toLowerCase().trim() === normalizedSource
    );
    
    if (matchedValue) {
      return {
        sourceValue,
        status: 'matched' as const,
        existingTagName: matchedValue,
        mappedTagName: matchedValue,
      };
    } else {
      return {
        sourceValue,
        status: 'new' as const,
        mappedTagName: sourceValue, // Will be created with this name
      };
    }
  });
  
  const matchedCount = mappings.filter(m => m.status === 'matched').length;
  const unmatchedCount = mappings.filter(m => m.status === 'new').length;
  
  return {
    tagTypeId: tagType.id,
    tagTypeName: tagType.name,
    columnName,
    stats: {
      uniqueCount: uniqueValuesArray.length,
      matchedCount,
      unmatchedCount,
    },
    mappings,
  };
}

