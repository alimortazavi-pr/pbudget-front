import type { MessageTree } from "../../types";

export const debtsMessages: MessageTree = {
  settled: "Settled",
  remaining: "Remaining",
  sourceDetached: "Source link removed",
  settlementDetached: "Settlement unlinked",
  detachSettlement: "Unlink settlement",
  attachSource: "Link source transaction",
  attachSettlement: "Link settlement transaction",
  settle: "Settlement",
  registerSettlement: "Record settlement",
  registerSettlements: "Record {{count}} settlements",
  noMatchingTransaction: "No matching transaction found. First record an",
  incomeDeposit: "Income (deposit)",
  costWithdraw: "Expense (withdrawal)",
  registerFirst: "transaction.",
};
