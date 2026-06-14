export type OccurrenceStatus = "pending" | "paid" | "skipped";

export interface IPaymentPlan {
  _id: string;
  title: string;
  person?: string;
  amount: number;
  category?: { _id: string; title: string };
  dueDayOfMonth: number;
  totalInstallments?: number;
  completedInstallments: number;
  startYear: number;
  startMonth: number;
  remindOnMonthStart: boolean;
  remindDaysBefore: number;
  active: boolean;
  description?: string;
}

export interface IPaymentPlanOccurrence {
  _id: string;
  plan: IPaymentPlan;
  sequence: number;
  year: number;
  month: number;
  day: number;
  amount: number;
  status: OccurrenceStatus;
  payNote?: string;
  paidBudget?: { _id: string };
}

export interface IMonthlyPaymentOverview {
  year: number;
  month: number;
  pendingAmount: number;
  paidAmount: number;
  pendingCount: number;
  paidCount: number;
  occurrences: IPaymentPlanOccurrence[];
}
