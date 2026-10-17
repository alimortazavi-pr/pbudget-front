import { axiosInstance } from "@/common/axiosInstance";
import type {
  IBudget,
  IBudgetMutationResult,
  IBudgetsSummary,
} from "@/common/interfaces/budget.interface";
import { sortBudgetsByTransactionDateDesc } from "@/common/utils/jalali-date";

export type BudgetDuration = "daily" | "monthly" | "yearly" | "all";
export type BudgetExportType = "excel" | "html";
export type BudgetExportParams = {
  duration: BudgetDuration;
  year: string;
  month: string;
  day?: string;
  category?: string;
  type: BudgetExportType;
};

export async function fetchBudgets(
  params: Record<string, string>,
  token?: string
) {
  const { data } = await axiosInstance.get<IBudgetsSummary>("/budgets", {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return {
    ...data,
    // A paginated response is already in the order the user asked for.
    budgets: data.pagination ? (data.budgets ?? []) : sortBudgetsByTransactionDateDesc(data.budgets ?? []),
  };
}

export async function fetchBudgetsForAttach(params: {
  context: string;
  contextId: string;
  duration: string;
  year?: string;
  month?: string;
  category?: string;
  q?: string;
  page?: string;
  limit?: string;
}) {
  const { data } = await axiosInstance.get<{
    budgets: IBudget[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }>("/budgets/for-attach", { params });
  return data;
}

export async function fetchBudgetById(id: string, token?: string) {
  const { data } = await axiosInstance.get(`/budgets/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function createBudget(payload: Record<string, string>) {
  const { data } = await axiosInstance.post<IBudgetMutationResult>(
    "/budgets",
    payload
  );
  return data;
}

export async function updateBudget(
  id: string,
  payload: Record<string, string>
) {
  const { data } = await axiosInstance.put<IBudgetMutationResult>(
    `/budgets/${id}`,
    payload
  );
  return data;
}

export async function hardDeleteBudget(id: string) {
  const { data } = await axiosInstance.delete<
    Pick<
      IBudgetMutationResult,
      "userBudget" | "userWalletBalances" | "currency"
    >
  >(`/budgets/${id}`);
  return data;
}

function buildExportQuery({
  duration,
  year,
  month,
  day,
  category,
}: Omit<BudgetExportParams, "type">) {
  const params: Record<string, string> = { duration };

  if (duration !== "all") {
    params.year = year;
  }
  if (duration === "monthly" || duration === "daily") {
    params.month = month;
  }
  if (duration === "daily" && day) {
    params.day = day;
  }
  if (category) {
    params.category = category;
  }

  return params;
}

export async function exportBudgets({ type, ...filters }: BudgetExportParams) {
  const endpoint =
    type === "excel" ? "/budgets/excel-export" : "/budgets/html-export";

  const { data } = await axiosInstance.get<Blob>(endpoint, {
    params: buildExportQuery(filters),
    responseType: "blob",
  });

  return data;
}

export function downloadExportFile(
  blob: Blob,
  type: BudgetExportType,
  duration?: BudgetDuration,
  date?: { year: string; month: string; day: string }
) {
  const extension = type === "excel" ? "xlsx" : "html";
  const period =
    duration === "all"
      ? "all"
      : duration === "yearly"
      ? date?.year ?? "year"
      : duration === "monthly"
      ? `${date?.year ?? "y"}-${date?.month ?? "m"}`
      : `${date?.year ?? "y"}-${date?.month ?? "m"}-${date?.day ?? "d"}`;
  const filename = `paradise-budget-${period}-${Date.now()}.${extension}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function openExportInBrowser(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

// ---- Trash and bulk delete -------------------------------------------------

export type DeleteMode = "trash" | "permanent";
type WalletPayload = Pick<IBudgetMutationResult, "userBudget" | "userWalletBalances" | "currency">;

export interface BulkDeleteResult extends WalletPayload {
  trashed: string[];
  deleted: string[];
  /** Linked transactions (debts, installments, checks, boxes, work hours) that can only be deleted permanently. */
  blocked: { id: string; reason: string }[];
  failed: { id: string; reason: string }[];
}

export interface TrashedBudget extends IBudget {
  trashedAt: string;
  purgeAt: string;
}

export interface TrashList {
  items: TrashedBudget[];
  retentionDays: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function moveBudgetToTrash(id: string) {
  const { data } = await axiosInstance.delete<WalletPayload>(`/budgets/${id}/trash`);
  return data;
}

export async function bulkDeleteBudgets(ids: string[], mode: DeleteMode) {
  const { data } = await axiosInstance.post<BulkDeleteResult>("/budgets/bulk-delete", { ids, mode });
  return data;
}

export async function fetchTrash(page = 1) {
  const { data } = await axiosInstance.get<TrashList>("/budgets/trash", { params: { page, limit: 30 } });
  return data;
}

export async function restoreFromTrash(ids: string[]) {
  const { data } = await axiosInstance.post<WalletPayload & { restored: string[]; failed: { id: string; reason: string }[] }>(
    "/budgets/trash/restore",
    { ids },
  );
  return data;
}

export async function purgeTrash(target: string[] | "all") {
  const { data } = await axiosInstance.post<WalletPayload & { deleted: string[] }>(
    "/budgets/trash/purge",
    target === "all" ? { all: true } : { ids: target },
  );
  return data;
}
