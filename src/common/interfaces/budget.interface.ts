import type { ICategory } from "./category.interface";
import type { ICredit } from "./credit.interface";

export interface IBudgetState {
  budgets: IBudget[] | null;
  totalCostPrice: number | null;
  totalIncomePrice: number | null;
}

export interface IBudget {
  _id: string;
  user: string;
  category: ICategory;
  price: number;
  type: number;
  deleted: boolean;
  year: string;
  month: string;
  day: string;
  description: string;
  createdAt: string;
  credits?: ICredit[];
}

export interface ICreateAndEditBudgetForm {
  price: string | number;
  type: number;
  category: string;
  year: string;
  month: string;
  day: string;
  description: string;
}

export interface IBudgetsSummary {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
}
