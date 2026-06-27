import { axiosInstance } from "@/common/axiosInstance";
import type {
  IBankImportConfirmResult,
  IBankImportPendingBudget,
  IBankImportPreview,
} from "@/common/interfaces/bank.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { ImportRowExtras } from "@/components/pages/bank-import/import-row.types";

export type ConfirmBankImportRowPayload = {
  tempId: string;
  price: number;
  type: number;
  year: number;
  month: number;
  day: number;
  description: string;
  statementRef: string;
  categoryId: string;
  skip?: boolean;
} & ImportRowExtras;

export async function previewBankImport(bankId: string, file: File) {
  const formData = new FormData();
  formData.append("bankId", bankId);
  formData.append("file", file);

  const { data } = await axiosInstance.post<IBankImportPreview>(
    "/bank-imports/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function confirmBankImport(payload: {
  bankId: string;
  fileName?: string;
  rows: ConfirmBankImportRowPayload[];
}) {
  const { data } = await axiosInstance.post<IBankImportConfirmResult>(
    "/bank-imports/confirm",
    payload,
  );
  return data;
}

export async function fetchPendingBankImports() {
  const { data } = await axiosInstance.get<{
    budgets: IBankImportPendingBudget[];
    count: number;
  }>("/bank-imports/pending");
  return data;
}

export async function categorizeBankImports(
  items: Array<{ budgetId: string; categoryId: string }>,
) {
  const { data } = await axiosInstance.patch<{
    budgets: IBudget[];
    pendingCount: number;
  }>("/bank-imports/categorize", { items });
  return data;
}
