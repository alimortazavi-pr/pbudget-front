import type { UserCurrency, UserDateCalendar } from "@/common/constants/user-preferences";
import type { IBudget } from "./budget.interface";
import type { ICategory } from "./category.interface";

export type DebtStatus = "open" | "partial" | "settled";

export type DebtSettlement = {
  _id?: string;
  budget: IBudget | string;
  amount: number;
  settledAt: string;
};

export interface IDebt {
  _id: string;
  type: number;
  person: string;
  totalAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  sourceBudget?: IBudget | string;
  category: ICategory | string;
  year: number;
  month: number;
  day: number;
  currency?: UserCurrency;
  dateCalendar?: UserDateCalendar;
  description?: string;
  settlements: DebtSettlement[];
  createdAt: string;
  updatedAt: string;
}

export interface IDebtSummary {
  openReceivable: number;
  openPayable: number;
  openReceivableCount: number;
  openPayableCount: number;
  openCount: number;
}
