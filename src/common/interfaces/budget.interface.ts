import type { ICategory } from "./category.interface";
import type { IDebt } from "./debt.interface";
import type { IPaymentCard } from "./payment-card.interface";
import type { IVenture } from "./partner.interface";

export interface IProjectRef {
  _id: string;
  category?: ICategory;
}

export interface IBudgetState {
  budgets: IBudget[] | null;
  totalCostPrice: number | null;
  totalIncomePrice: number | null;
  /** Incremented after budget mutations to trigger list refetches. */
  revision: number;
}

export interface IBudgetMutationResult {
  budget: IBudget;
  userBudget: number;
}

export interface IBudgetPerformer {
  userId: string;
  displayName: string;
  partnerId: string | null;
  isOwner: boolean;
  sharePercent: number;
  shareAmount: number;
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
  debt?: IDebt | null;
  project?: IProjectRef | string | null;
  venture?: IVenture | string | null;
  paymentCard?: IPaymentCard | string | null;
  performer?: IBudgetPerformer;
}

export interface ICreateAndEditBudgetForm {
  price: string | number;
  type: number;
  category: string;
  year: string;
  month: string;
  day: string;
  description: string;
  paymentCardId?: string;
  projectId?: string;
}

export interface IBudgetsSummary {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
}
