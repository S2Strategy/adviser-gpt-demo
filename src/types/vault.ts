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
  type: "Commentary" | "Policy" | "Policies" | "Quantitative" | "Questionnaire" | "Questionnaires" | "Data Files" | "Drafts";
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
  // Nested QA support
  parentId?: string; // ID of parent question if this is a nested question
  children?: QuestionItem[]; // Child questions if this is a parent
  isExpanded?: boolean; // Whether this parent question is expanded (default true)
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