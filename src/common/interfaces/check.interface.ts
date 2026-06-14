export type CheckStatus = "pending" | "cleared" | "bounced" | "cancelled";

export interface ICheck {
  _id: string;
  type: number;
  amount: number;
  person: string;
  bankName?: string;
  checkNumber?: string;
  dueYear: number;
  dueMonth: number;
  dueDay: number;
  status: CheckStatus;
  description?: string;
  linkedBudget?: { _id: string };
}

export interface ICheckSummary {
  pendingReceivable: number;
  pendingPayable: number;
  pendingReceivableCount: number;
  pendingPayableCount: number;
  pendingCount: number;
}
