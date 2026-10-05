import { resolveBudgetCurrency } from "@/common/constants/user-preferences";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { normalizeQuickText } from "@/common/utils/quick-entry";
import { shouldConvertToman, tomanToDisplayAmount } from "@/common/utils/money-display";

/** Filters applied on top of the period the server returned. Kept in the URL. */
export type TransactionFilters = {
  q: string;
  /** "" = both, "0" income, "1" expense */
  type: "" | "0" | "1";
  /** Amounts in the unit the user sees (toman or rial). */
  min: string;
  max: string;
  card: string;
  project: string;
  /** Comma separated flags, see FILTER_FLAGS. */
  flags: string;
  /** y/m/d as "YYYY-MM-DD" in the user's calendar. */
  from: string;
  to: string;
  sort: "" | "oldest" | "highest" | "lowest";
};

export const FILTER_KEYS = ["q", "type", "min", "max", "card", "project", "flags", "from", "to", "sort"] as const;

export const FILTER_FLAGS = ["debt", "imported", "uncategorized", "noNote", "hasNote", "project"] as const;
export type FilterFlag = (typeof FILTER_FLAGS)[number];

export const EMPTY_FILTERS: TransactionFilters = {
  q: "",
  type: "",
  min: "",
  max: "",
  card: "",
  project: "",
  flags: "",
  from: "",
  to: "",
  sort: "",
};

export function readFilters(get: (key: string, fallback?: string) => string): TransactionFilters {
  const type = get("type");
  const sort = get("sort");
  return {
    q: get("q"),
    type: type === "0" || type === "1" ? type : "",
    min: get("min"),
    max: get("max"),
    card: get("card"),
    project: get("project"),
    flags: get("flags"),
    from: get("from"),
    to: get("to"),
    sort: sort === "oldest" || sort === "highest" || sort === "lowest" ? sort : "",
  };
}

export function flagList(flags: string): FilterFlag[] {
  return flags.split(",").filter((flag): flag is FilterFlag => (FILTER_FLAGS as readonly string[]).includes(flag));
}

export function countActiveFilters(filters: TransactionFilters, category = "") {
  let count = category ? 1 : 0;
  if (filters.q) count++;
  if (filters.type) count++;
  if (filters.min) count++;
  if (filters.max) count++;
  if (filters.card) count++;
  if (filters.project) count++;
  count += flagList(filters.flags).length;
  if (filters.from) count++;
  if (filters.to) count++;
  return count;
}

function dateKey(year: string | number, month: string | number, day: string | number) {
  return Number(year) * 10000 + Number(month) * 100 + Number(day);
}

function parseDateKey(value: string) {
  const match = /^(\d{3,4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  return match ? dateKey(match[1], match[2], match[3]) : null;
}

export function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String((value as { _id?: string })._id ?? "");
}

function searchableText(budget: IBudget) {
  const project = typeof budget.project === "object" && budget.project ? budget.project : null;
  const card = typeof budget.paymentCard === "object" && budget.paymentCard ? budget.paymentCard : null;
  const bank = typeof budget.sourceBank === "object" && budget.sourceBank ? budget.sourceBank : null;
  return normalizeQuickText(
    [
      budget.description,
      budget.category?.title,
      budget.debt?.person,
      project?.category?.title,
      card?.title,
      card?.bankName,
      card?.lastFour,
      bank?.title,
      String(budget.price),
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();
}

export function applyTransactionFilters(budgets: IBudget[], filters: TransactionFilters): IBudget[] {
  const q = normalizeQuickText(filters.q).toLowerCase();
  const words = q ? q.split(" ") : [];
  const min = filters.min ? Number(normalizeQuickText(filters.min).replace(/,/g, "")) : null;
  const max = filters.max ? Number(normalizeQuickText(filters.max).replace(/,/g, "")) : null;
  const from = parseDateKey(filters.from);
  const to = parseDateKey(filters.to);
  const flags = flagList(filters.flags);

  const list = budgets.filter((budget) => {
    if (filters.type && String(budget.type) !== filters.type) return false;
    if (filters.card && refId(budget.paymentCard) !== filters.card) return false;
    if (filters.project) {
      const id = refId(budget.project);
      if (filters.project === "none" ? id : id !== filters.project) return false;
    }
    if (min !== null || max !== null) {
      const currency = resolveBudgetCurrency(budget.currency);
      const shown = shouldConvertToman(currency) ? tomanToDisplayAmount(budget.price) : budget.price;
      if (min !== null && Number.isFinite(min) && shown < min) return false;
      if (max !== null && Number.isFinite(max) && shown > max) return false;
    }
    if (from !== null || to !== null) {
      const key = dateKey(budget.year, budget.month, budget.day);
      if (from !== null && key < from) return false;
      if (to !== null && key > to) return false;
    }
    for (const flag of flags) {
      if (flag === "debt" && !budget.debt) return false;
      if (flag === "imported" && !budget.sourceBank) return false;
      if (flag === "uncategorized" && budget.category) return false;
      if (flag === "noNote" && budget.description?.trim()) return false;
      if (flag === "hasNote" && !budget.description?.trim()) return false;
      if (flag === "project" && !budget.project) return false;
    }
    if (words.length) {
      const text = searchableText(budget);
      if (!words.every((word) => text.includes(word))) return false;
    }
    return true;
  });

  if (filters.sort === "oldest") {
    return [...list].sort(
      (a, b) => dateKey(a.year, a.month, a.day) - dateKey(b.year, b.month, b.day) || a.createdAt.localeCompare(b.createdAt),
    );
  }
  if (filters.sort === "highest") return [...list].sort((a, b) => b.price - a.price);
  if (filters.sort === "lowest") return [...list].sort((a, b) => a.price - b.price);
  return list;
}

export function sumByType(budgets: IBudget[], currency: string) {
  let income = 0;
  let cost = 0;
  for (const budget of budgets) {
    if (resolveBudgetCurrency(budget.currency) !== currency) continue;
    if (budget.type === 0) income += budget.price;
    else cost += budget.price;
  }
  return { income, cost };
}
