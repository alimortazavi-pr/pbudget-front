import { axiosInstance } from "@/common/axiosInstance";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IDebt, IDebtSummary } from "@/common/interfaces/debt.interface";

export async function fetchDebtSummary() {
  const { data } = await axiosInstance.get<IDebtSummary>("/debts/summary");
  return data;
}

export async function fetchDebtPersons() {
  const { data } = await axiosInstance.get<{ persons: string[] }>("/debts/persons");
  return data.persons;
}

export async function fetchDebts(params?: {
  status?: string;
  type?: string;
  person?: string;
}) {
  const { data } = await axiosInstance.get<{ debts: IDebt[] }>("/debts", {
    params,
  });
  return data;
}

export async function fetchDebt(id: string) {
  const { data } = await axiosInstance.get<{ debt: IDebt }>(`/debts/${id}`);
  return data.debt;
}

export async function createDebt(payload: {
  sourceBudgetId: string;
  type: string;
  person: string;
  amount?: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ debt: IDebt }>("/debts", payload);
  return data;
}

export async function createStandaloneDebt(payload: {
  type: string;
  person: string;
  amount: string;
  category: string;
  year: string;
  month: string;
  day: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ debt: IDebt }>("/debts/standalone", payload);
  return data.debt;
}

export async function fetchSourceCandidates(debtId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/debts/${debtId}/source-candidates`,
  );
  return data;
}

export async function attachDebtSource(debtId: string, budgetId: string) {
  const { data } = await axiosInstance.post<{ debt: IDebt }>(
    `/debts/${debtId}/attach-source`,
    { budgetId },
  );
  return data.debt;
}

export async function settleDebt(
  debtId: string,
  payload: { budgetId: string; amount?: string },
) {
  const { data } = await axiosInstance.post<{ debt: IDebt }>(
    `/debts/${debtId}/settle`,
    payload,
  );
  return data;
}

export async function fetchSettlementCandidates(debtId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/debts/${debtId}/settlement-candidates`,
  );
  return data;
}

export async function deleteDebt(debtId: string) {
  await axiosInstance.delete(`/debts/${debtId}`);
}
