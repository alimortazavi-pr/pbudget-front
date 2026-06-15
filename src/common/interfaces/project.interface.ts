import type { IBudget } from "./budget.interface";
import type { ICategory } from "./category.interface";
import type { IPaymentPlan } from "./payment-plan.interface";

export type ProjectStatus = "active" | "completed" | "on_hold";
export type ProjectItemType = "note" | "task";

export interface IProjectStats {
  receivedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  profitAmount: number;
  transactionCount: number;
}

export interface IProject {
  _id: string;
  user: string;
  category: ICategory;
  totalAmount: number;
  status: ProjectStatus;
  description: string;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  stats?: IProjectStats;
}

export interface IProjectItem {
  _id: string;
  user: string;
  project: string;
  type: ProjectItemType;
  content: string;
  done: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProjectDetail {
  project: IProject;
  budgets: IBudget[];
  items: IProjectItem[];
  paymentPlans: IPaymentPlan[];
}
