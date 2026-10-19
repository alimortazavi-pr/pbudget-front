export interface ITransactionTemplate {
  _id: string;
  title: string;
  /** 0 = income, 1 = cost (same as BudgetType). */
  type: number;
  /** 0 = ask for the amount each time. */
  price: number;
  category: string | null;
  paymentCard: string | null;
  project: string | null;
  description: string;
  usageCount: number;
  lastUsedAt?: string | null;
}

export type TransactionTemplatePayload = {
  title?: string;
  type?: "0" | "1";
  price?: string;
  categoryId?: string;
  paymentCardId?: string;
  projectId?: string;
  description?: string;
};
