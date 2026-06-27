import type { DebtLedgerValue } from "@/components/pages/budget/DebtLedgerSection";
import type { ProjectLedgerValue } from "@/components/pages/budget/ProjectLedgerSection";
import type { VentureLedgerValue } from "@/components/pages/budget/VentureLedgerSection";
import type { IParsedBankRow } from "@/common/interfaces/bank.interface";

export type ImportRowDraft = Omit<
  IParsedBankRow,
  "type" | "price" | "year" | "month" | "day"
> & {
  selected: boolean;
  price: string;
  type: string;
  year: string;
  month: string;
  day: string;
  categoryId: string;
  description: string;
  paymentCardId: string;
  projectLedger: ProjectLedgerValue;
  ventureLedger: VentureLedgerValue;
  debtLedger: DebtLedgerValue;
};

export type ImportRowExtras = {
  paymentCardId?: string;
  projectId?: string;
  ventureId?: string;
  debt?: {
    enabled: boolean;
    mode: DebtLedgerValue["mode"];
    debtType?: string;
    person?: string;
    settleDebtId?: string;
  };
};
