import * as XLSX from 'xlsx';
import { Tag } from '@/types/vault';

export interface ParsedExcelRow {
  [columnName: string]: string | number | null;
}

export interface ExcelParseResult {
  headers: string[];
  rows: ParsedExcelRow[];
  sheetName: string;
}

/**
 * Parse an Excel file (XLSX, XLS, or CSV) and return headers and rows
 */
export function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
        }) as (string | number | null)[][];

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // First row is headers
        // Filter out empty strings and ensure all headers are non-empty
        const headers = (jsonData[0] || [])
          .map((h, index) => {
            const str = String(h || '').trim();
            // If header is empty, use a fallback name
            return str || `Column ${index + 1}`;
          })
          .filter((h, index, arr) => {
            // Ensure no duplicates and no empty strings
            return h && arr.indexOf(h) === index;
          });
        
        if (headers.length === 0) {
          reject(new Error('No headers found in Excel file'));
          return;
        }

        // Remaining rows are data
        const rows: ParsedExcelRow[] = jsonData.slice(1).map(row => {
          const rowObj: ParsedExcelRow = {};
          headers.forEach((header, index) => {
            const value = row[index];
            rowObj[header] = value !== null && value !== undefined ? String(value).trim() : null;
          });
          return rowObj;
        }).filter(row => {
          // Filter out completely empty rows
          return Object.values(row).some(val => val !== null && val !== '');
        });

        resolve({
          headers,
          rows,
          sheetName: firstSheetName,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read as binary string for all formats (xlsx library handles CSV too)
    reader.readAsBinaryString(file);
  });
}

/**
 * Extract unique values from a column, splitting by comma
 */
export function extractTagValuesFromColumn(rows: ParsedExcelRow[], columnName: string): string[] {
  const values = new Set<string>();
  
  rows.forEach(row => {
    const cellValue = row[columnName];
    if (cellValue) {
      const stringValue = String(cellValue);
      // Split by comma and trim each value
      stringValue.split(',').forEach(val => {
        const trimmed = val.trim();
        if (trimmed) {
          values.add(trimmed);
        }
      });
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Parse comma-separated values from a cell
 */
export function parseCommaSeparatedValues(value: string | number | null): string[] {
  if (!value) return [];
  const stringValue = String(value);
  return stringValue.split(',').map(v => v.trim()).filter(Boolean);
}

