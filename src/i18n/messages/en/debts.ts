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
  attachEmptySettlement:
    "No matching settlement transaction. For a {{kind}} you need an unused {{txType}} in {{currency}}.",
  attachEmptySource:
    "No matching source transaction. For a {{kind}} you need an unused {{txType}} in {{currency}}.",
  existingActiveTitle:
    "{{count}} active item(s) already exist for «{{person}}»",
  existingActiveHint:
    "To avoid duplicates, pick an existing item to settle against, or create a new one if this is truly a new commitment.",
  linkToExisting: "Link and settle with this item",
  createNewAnyway: "Create new receivable/debt",
  creatingNewConfirmed: "You are creating a new item for this name.",
  showExistingAgain: "Show existing items",
  chooseLinkOrCreate:
    "{{count}} active item(s) already exist for «{{person}}». Link to an existing one or choose create new.",
};
