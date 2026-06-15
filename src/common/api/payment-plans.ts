import { axiosInstance } from "@/common/axiosInstance";
import type {
  IMonthlyPaymentOverview,
  IPaymentPlan,
  IPaymentPlanDetail,
} from "@/common/interfaces/payment-plan.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";

export async function fetchMonthlyPayments(year: string, month: string) {
  const { data } = await axiosInstance.get<IMonthlyPaymentOverview>(
    "/payment-plans/monthly",
    { params: { year, month } },
  );
  return data;
}

export async function fetchPaymentPlans() {
  const { data } = await axiosInstance.get<{ plans: IPaymentPlan[] }>("/payment-plans");
  return data.plans;
}

export async function fetchPaymentPlanPersons() {
  const { data } = await axiosInstance.get<{ persons: string[] }>("/payment-plans/persons");
  return data.persons;
}

export async function fetchPaymentPlanBudgetCandidates(planId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/payment-plans/${planId}/budget-candidates`,
  );
  return data;
}

export async function linkOccurrenceBudget(
  occurrenceId: string,
  payload: { budgetId: string; note?: string },
) {
  const { data } = await axiosInstance.post(
    `/payment-plans/occurrences/${occurrenceId}/link-budget`,
    payload,
  );
  return data;
}

export async function fetchPaymentPlan(id: string) {
  const { data } = await axiosInstance.get<IPaymentPlanDetail>(`/payment-plans/${id}`);
  return data;
}

export async function updatePaymentPlan(
  id: string,
  payload: {
    title?: string;
    person?: string;
    amount?: string;
    category?: string;
    dueDayOfMonth?: string;
    remindOnMonthStart?: boolean;
    remindDaysBefore?: string;
    active?: boolean;
    description?: string;
  },
) {
  const { data } = await axiosInstance.patch<{ plan: IPaymentPlan }>(
    `/payment-plans/${id}`,
    payload,
  );
  return data.plan;
}

export async function createPaymentPlan(payload: {
  title: string;
  person?: string;
  amount: string;
  category?: string;
  dueDayOfMonth: string;
  totalInstallments?: string;
  startYear: string;
  startMonth: string;
  remindOnMonthStart?: boolean;
  remindDaysBefore?: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ plan: IPaymentPlan }>(
    "/payment-plans",
    payload,
  );
  return data;
}

export async function deletePaymentPlan(id: string) {
  await axiosInstance.delete(`/payment-plans/${id}`);
}

export async function payOccurrence(
  id: string,
  payload: {
    category: string;
    amount?: string;
    year: string;
    month: string;
    day: string;
    note?: string;
  },
) {
  const { data } = await axiosInstance.post(`/payment-plans/occurrences/${id}/pay`, payload);
  return data;
}

export async function skipOccurrence(id: string, note?: string) {
  const { data } = await axiosInstance.post(`/payment-plans/occurrences/${id}/skip`, {
    note,
  });
  return data;
}
