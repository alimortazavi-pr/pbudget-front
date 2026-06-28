export interface IBank {
  _id: string;
  title: string;
  slug: string;
  parserType: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IParsedBankRow {
  tempId: string;
  price: number;
  type: number;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  description: string;
  transactionKind: string;
  statementRef: string;
  rowNumber: number;
  isDuplicate?: boolean;
}

export interface IBankImportPreview {
  bank: Pick<IBank, "_id" | "title" | "slug">;
  meta: {
    periodFrom?: string;
    periodTo?: string;
    accountHolder?: string;
  };
  rows: IParsedBankRow[];
  duplicateCount: number;
}

export interface IBankImportConfirmResult {
  batchId: string;
  importedCount: number;
  skippedDuplicates: number;
  pendingCount: number;
  createdBudgetIds: string[];
  userBudget: number;
}

export interface IBankImportPendingBudget {
  _id: string;
  price: number;
  type: number;
  year: number;
  month: number;
  day: number;
  description: string;
  pendingCategory: boolean;
  category?: { _id: string; title: string; color?: string } | null;
  sourceBank?: IBank | null;
}
