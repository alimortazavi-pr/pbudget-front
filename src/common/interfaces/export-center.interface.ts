/** Shapes of the export center API (`/v1/export-center`). */

export type ExportSourceKey =
  | "transactions"
  | "categories"
  | "debts"
  | "debtSettlements"
  | "installmentPlans"
  | "installments"
  | "checks"
  | "boxes"
  | "boxMovements"
  | "paymentCards"
  | "projects"
  | "workSessions"
  | "partnerLedger"
  | "partners"
  | "tasks"
  | "notes"
  | "runningTabs";

export type ExportColumnKind = "text" | "money" | "number" | "date" | "datetime" | "boolean" | "percent" | "hours" | "time";

export type ExportFilterKey =
  | "type"
  | "categories"
  | "cards"
  | "projects"
  | "contexts"
  | "boxes"
  | "noteCategories"
  | "amount"
  | "currency"
  | "statuses"
  | "priorities"
  | "q"
  | "flags"
  | "excludeBoxTransfers"
  | "includeGeneral";

export type ExportGroupKey =
  | "none"
  | "category"
  | "parentCategory"
  | "month"
  | "year"
  | "card"
  | "type"
  | "project"
  | "currency"
  | "person"
  | "status"
  | "plan"
  | "box"
  | "context"
  | "performer"
  | "priority"
  | "noteCategory"
  | "duration";

export type ExportRangePreset =
  | "all"
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "last30"
  | "last90"
  | "thisYear"
  | "lastYear"
  | "custom";

export type ExportFormat = "xlsx" | "csv" | "html";

export interface ExportOption {
  value: string;
  label: string;
}

export interface ExportColumnDef {
  key: string;
  label: string;
  kind: ExportColumnKind;
  default?: boolean;
  width?: number;
  sum?: boolean;
}

export interface ExportSourceDef {
  key: ExportSourceKey;
  label: string;
  description: string;
  feature: string | null;
  dateColumn: string | null;
  dated: boolean;
  columns: ExportColumnDef[];
  filters: ExportFilterKey[];
  groups: ExportGroupKey[];
  types?: ExportOption[];
  statuses?: ExportOption[];
  flags?: ExportOption[];
  defaultSort: { field: string; dir: "asc" | "desc" };
  available: boolean;
}

export interface ExportCenterMeta {
  sources: ExportSourceDef[];
  groups: Record<ExportGroupKey, string>;
  rangePresets: Record<ExportRangePreset, string>;
  options: {
    categories: Array<{ _id: string; title: string; parent: string | null; color: string }>;
    cards: Array<{ _id: string; title: string; bankName: string; lastFour: string }>;
    projects: Array<{ _id: string; title: string; status: string }>;
    boxes: Array<{ _id: string; title: string }>;
    noteCategories: Array<{ _id: string; title: string }>;
    contexts: Array<{ _id: string; title: string; type: "venture" | "project"; role: "owner" | "partner" }>;
  };
  templates: Array<{ _id: string; name: string }>;
  features: { brandedTemplates: boolean };
  preferences: { calendar: "jalali" | "gregorian"; moneyUnit: "toman" | "rial"; currency: "toman" | "usd" | "dinar" };
  limits: { perSource: number; total: number; previewRows: number };
}

export interface ExportFilters {
  type?: string;
  categories?: string[];
  includeSubcategories?: boolean;
  cards?: string[];
  projects?: string[];
  contexts?: string[];
  boxes?: string[];
  noteCategories?: string[];
  /** Canonical stored amount (toman for Iranian money), never the rial display value. */
  min?: number;
  max?: number;
  currencies?: string[];
  statuses?: string[];
  priorities?: string[];
  q?: string;
  flags?: string[];
  excludeBoxTransfers?: boolean;
  includeGeneral?: boolean;
}

export interface ExportSourceRequest {
  key: ExportSourceKey;
  columns?: string[];
  sort?: { field: string; dir: "asc" | "desc" };
  groupBy?: ExportGroupKey;
  filters?: ExportFilters;
}

export interface ExportOptions {
  calendar?: "jalali" | "gregorian";
  moneyUnit?: "toman" | "rial";
  digits?: "fa" | "latin";
  thousands?: boolean;
  dateStyle?: "slash" | "dash" | "long";
  showCurrency?: boolean;
  includeSummary?: boolean;
  includeTotals?: boolean;
  title?: string;
  subtitle?: string;
  templateId?: string;
}

export interface ExportRequest {
  sources: ExportSourceRequest[];
  range: { preset: ExportRangePreset; from?: string; to?: string };
  options?: ExportOptions;
}

export interface ExportKpi {
  label: string;
  value: number;
  kind: "money" | "number" | "hours" | "percent";
  currency?: string;
  tone?: "positive" | "negative" | "neutral";
  text: string;
}

export interface ExportPreviewSheet {
  key: ExportSourceKey;
  label: string;
  matched: number;
  exported: number;
  truncated: boolean;
  groupBy: ExportGroupKey;
  groups: Array<{ label: string; count: number }> | null;
  columns: Array<{ key: string; label: string; kind: ExportColumnKind }>;
  rows: string[][];
  kpis: ExportKpi[];
  filterSummary: string[];
}

export interface ExportPreview {
  title: string;
  rangeLabel: string;
  totalRows: number;
  limits: { perSource: number; total: number };
  sheets: ExportPreviewSheet[];
}

export interface ExportPresetItem {
  _id: string;
  name: string;
  description: string;
  format: ExportFormat;
  favorite: boolean;
  config: ExportRequest;
  lastUsedAt?: string | null;
  updatedAt?: string;
}

export interface ExportHistoryItem {
  _id: string;
  sources: ExportSourceKey[];
  format: ExportFormat;
  rowCount: number;
  truncated: boolean;
  rangeLabel: string;
  filename: string;
  config: ExportRequest;
  createdAt: string;
}
