// AdvisorGPT Vault Data Types

// Tag structure: tags have a type and a value
export interface Tag {
  type: string;
  value: string;
}

// Tag type configuration for tenant
export interface TagType {
  id: string;
  name: string;
  values: string[];
}

// Tag type configuration stored per tenant
export interface TagTypeConfig {
  tagTypes: TagType[];
}

export interface QuestionItem {
  id: string;
  type: "Commentary" | "Policy" | "Policies" | "Quantitative" | "Questionnaire" | "Questionnaires" | "Data Files" | "Drafts" | "Samples";
  // Legacy field - kept for backward compatibility during migration
  // In new system, strategies are stored as tags with type "Strategy"
  strategy?: string | string[];
  // New tag structure: array of tags with type and value
  tags: Tag[];
  question?: string;
  answer?: string;
  body?: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
  updatedAt: string; // ISO string
  updatedBy: string;
  isBestAnswer?: boolean; // Mark high-quality answers for badge display
  archived?: boolean; // Track if item is archived
  documentTitle?: string; // Title of the document this item belongs to
  documentId?: string; // ID of the document this item belongs to
  quarter?: string; // Quarter assignment in format "YYYY-QN" (e.g., "2024-Q1")
  // Nested QA support
  parentId?: string; // ID of parent question if this is a nested question
  children?: QuestionItem[]; // Child questions if this is a parent
  isExpanded?: boolean; // Whether this parent question is expanded (default true)
  // Change tracking
  changeHistory?: ChangeHistoryEntry[]; // History of changes to question/answer
}

export interface ContentItem {
  id: string;
  title: string;
  items: QuestionItem[];
}

export interface VaultFilters {
  // Legacy fields - kept for backward compatibility
  strategy?: string | string[];
  contentType?: string;
  tags?: string[];
  status?: string;
  // New filter structure: tag type -> selected values
  tagFilters?: Record<string, string[]>; // tagType -> selected values array
}

export interface VaultState {
  query: string;
  filters: VaultFilters;
  activeView: "files" | "type" | "strategy" | "data";
  sort: string;
  showArchived: boolean;
}

// Change tracking types
export interface ChangeHistoryEntry {
  date: string; // ISO string
  user: string;
  question: string;
  answer: string;
}

// Tag management types
export interface TagInfo {
  name: string;
  status: "Approved" | "Candidate" | "Deactivated";
  usage: number;
}

// Available options
export const STRATEGIES = [
  "Firm-Wide (Not Strategy-Specific)",
  "Emerging Markets",
  "ESG", 
  "ESG Investments",
  "Fixed Income",
  "Global Emerging Markets", 
  "Global Equity",
  "Large Cap Equity",
  "Large Cap Growth",
  "S2 Strategy General",
  "Small Cap Value", 
  "Tech Sector"
];

export const CONTENT_TYPES = ["Data Files", "Policies", "Questionnaires", "Insights"];

export const STATUS_OPTIONS = ["Active", "Archived", "Draft", "Under Review"];

export const TAGS_INFO: TagInfo[] = [
  { name: "Asset Allocation", status: "Deactivated", usage: 22 },
  { name: "Asset Management", status: "Approved", usage: 210 },
  { name: "Client Communication", status: "Approved", usage: 84 },
  { name: "Financial Analysis", status: "Approved", usage: 176 },
  { name: "Financial Services", status: "Approved", usage: 198 },
  { name: "Investment Management", status: "Approved", usage: 154 },
  { name: "Investment Strategy", status: "Approved", usage: 265 },
  { name: "Market Analysis", status: "Candidate", usage: 96 },
  { name: "Portfolio Management", status: "Approved", usage: 244 },
  { name: "Risk Management", status: "Approved", usage: 280 },
];

// Quarter helper functions
export function getCurrentQuarter(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1; // 1-4
  return `${year}-Q${quarter}`;
}

export function getQuarterFromString(quarterStr: string): { year: number; quarter: number } | null {
  const match = quarterStr.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    quarter: parseInt(match[2], 10),
  };
}

export function formatQuarter(quarterStr: string): string {
  const parsed = getQuarterFromString(quarterStr);
  if (!parsed) return quarterStr;
  return `Q${parsed.quarter} ${parsed.year}`;
}

export function getQuarterOptions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarterNum = Math.floor(now.getMonth() / 3) + 1; // 1-4
  const lastYear = currentYear - 1;
  const options: string[] = [];

  // Current year: Q4, Q3, Q2, Q1 — only if that quarter has passed or is current
  for (let q = 4; q >= 1; q--) {
    if (q <= currentQuarterNum) {
      options.push(`${currentYear}-Q${q}`);
    }
  }

  // Last year: Q4, Q3, Q2, Q1
  for (let q = 4; q >= 1; q--) {
    options.push(`${lastYear}-Q${q}`);
  }

  return options;
}