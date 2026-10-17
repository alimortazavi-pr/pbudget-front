import type {
  ExportFilters,
  ExportFormat,
  ExportOptions,
  ExportRangePreset,
  ExportRequest,
  ExportSourceDef,
  ExportSourceKey,
  ExportSourceRequest,
} from "@/common/interfaces/export-center.interface";

/** What the export builder edits; `toExportRequest` turns it into the API body. */
export interface ExportBuilderState {
  sources: ExportSourceRequest[];
  range: { preset: ExportRangePreset; from: string; to: string };
  options: ExportOptions;
  format: ExportFormat;
}

export const EXPORT_SOURCE_GROUPS: Array<{ titleKey: string; keys: ExportSourceKey[] }> = [
  { titleKey: "exports.groups.finance", keys: ["transactions", "categories", "paymentCards", "boxes", "boxMovements"] },
  {
    titleKey: "exports.groups.obligations",
    keys: ["debts", "debtSettlements", "installmentPlans", "installments", "checks", "runningTabs"],
  },
  { titleKey: "exports.groups.work", keys: ["projects", "workSessions", "partnerLedger", "partners"] },
  { titleKey: "exports.groups.planning", keys: ["tasks", "notes"] },
];

/** One-click starting points shown above the source picker. */
export const EXPORT_BUNDLES: Array<{ id: string; labelKey: string; keys: ExportSourceKey[] }> = [
  { id: "tx", labelKey: "exports.bundles.transactions", keys: ["transactions"] },
  {
    id: "finance",
    labelKey: "exports.bundles.finance",
    keys: ["transactions", "categories", "debts", "installments", "checks", "boxes"],
  },
  { id: "debts", labelKey: "exports.bundles.debts", keys: ["debts", "debtSettlements"] },
  { id: "work", labelKey: "exports.bundles.work", keys: ["projects", "workSessions"] },
];

export const RANGE_PRESET_ORDER: ExportRangePreset[] = [
  "thisMonth",
  "lastMonth",
  "last30",
  "last90",
  "thisYear",
  "lastYear",
  "thisWeek",
  "today",
  "all",
  "custom",
];

export function defaultSourceRequest(def: ExportSourceDef): ExportSourceRequest {
  return {
    key: def.key,
    columns: def.columns.filter((column) => column.default).map((column) => column.key),
    sort: { ...def.defaultSort },
    groupBy: "none",
    filters: def.filters.includes("categories") ? { includeSubcategories: true } : {},
  };
}

export function defaultBuilderState(
  defs: ExportSourceDef[],
  preferences: { calendar: "jalali" | "gregorian"; moneyUnit: "toman" | "rial" },
): ExportBuilderState {
  const transactions = defs.find((def) => def.key === "transactions");
  return {
    sources: transactions ? [defaultSourceRequest(transactions)] : [],
    range: { preset: "thisMonth", from: "", to: "" },
    format: "xlsx",
    options: {
      calendar: preferences.calendar,
      moneyUnit: preferences.moneyUnit,
      digits: "fa",
      thousands: true,
      dateStyle: "slash",
      showCurrency: false,
      includeSummary: true,
      includeTotals: true,
      title: "",
    },
  };
}

function cleanFilters(filters: ExportFilters = {}): ExportFilters {
  const out: ExportFilters = {};
  for (const [key, value] of Object.entries(filters) as Array<[keyof ExportFilters, unknown]>) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export function toExportRequest(state: ExportBuilderState): ExportRequest {
  const options: ExportOptions = { ...state.options };
  if (!options.title?.trim()) delete options.title;
  if (!options.subtitle?.trim()) delete options.subtitle;
  if (!options.templateId) delete options.templateId;
  return {
    sources: state.sources.map((source) => ({
      key: source.key,
      columns: source.columns,
      sort: source.sort,
      groupBy: source.groupBy ?? "none",
      filters: cleanFilters(source.filters),
    })),
    range:
      state.range.preset === "custom"
        ? {
            preset: "custom",
            ...(state.range.from ? { from: state.range.from } : {}),
            ...(state.range.to ? { to: state.range.to } : {}),
          }
        : { preset: state.range.preset },
    options,
  };
}

/** Back from a saved preset / history entry into an editable state. */
export function fromExportRequest(
  request: ExportRequest,
  format: ExportFormat,
  defs: ExportSourceDef[],
  fallback: ExportBuilderState,
): ExportBuilderState {
  const known = new Map(defs.map((def) => [def.key, def]));
  const sources = (request.sources ?? [])
    .filter((source) => known.has(source.key))
    .map((source) => ({ ...defaultSourceRequest(known.get(source.key)!), ...source, filters: source.filters ?? {} }));
  return {
    sources,
    range: {
      preset: request.range?.preset ?? "thisMonth",
      from: request.range?.from ?? "",
      to: request.range?.to ?? "",
    },
    options: { ...fallback.options, ...(request.options ?? {}) },
    format,
  };
}

/** Number of active filters on one source (for the badge on its panel). */
export function countSourceFilters(filters: ExportFilters = {}) {
  let count = 0;
  if (filters.type) count++;
  for (const key of ["categories", "cards", "projects", "contexts", "boxes", "noteCategories", "currencies", "statuses", "priorities", "flags"] as const) {
    if (filters[key]?.length) count++;
  }
  if (typeof filters.min === "number") count++;
  if (typeof filters.max === "number") count++;
  if (filters.q?.trim()) count++;
  if (filters.excludeBoxTransfers) count++;
  if (filters.includeGeneral === false) count++;
  return count;
}

const DRAFT_KEY = "pdesk.export-center.draft.v1";

export function loadExportDraft(): ExportBuilderState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExportBuilderState;
    return parsed && Array.isArray(parsed.sources) && parsed.range ? parsed : null;
  } catch {
    return null;
  }
}

export function saveExportDraft(state: ExportBuilderState) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function clearExportDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** "1405-7-3" style value used by the API from y/m/d picker parts. */
export function toRangeValue(parts: { year: string; month: string; day: string }) {
  if (!parts.year || !parts.month) return "";
  return `${parts.year}-${parts.month}-${parts.day || "1"}`;
}

export function fromRangeValue(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}
