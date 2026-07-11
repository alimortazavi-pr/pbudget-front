import type { MessageTree } from "../../types";

export const budgetMessages: MessageTree = {
  editTransaction: "Edit transaction",
  newTransaction: "New transaction",
  createCategory: "Create category",
  income: "Income",
  expense: "Expense",
  amountWithCurrency: "Amount ({{currency}})",
  dateGregorian: "Date (Gregorian)",
  dateJalali: "Date (Jalali)",
  bankImportBulkLink: "Bulk import from bank statement",
  paymentCardSource: "Payment card (source)",
  paymentCardDestination: "Receiving card (destination)",
  noCard: "No card",
  noCardRegistered: "No cards registered",
  noCardsYetPrefix: "You haven't added any cards yet. Go to",
  myCardsLink: "My cards",
  noCardsYetSuffix: "to add one.",
  projectLedgerTitle: "Record transaction under a specific project",
  projectLedgerCategoryHint:
    "With category «{{category}}», this transaction auto-links to the project.",
  projectLedgerVisibility:
    "The transaction appears on the project page and its financial reports.",
  noTransactionsInRange: "No transactions found for this period",
  attachTransactions: "Link {{count}} transactions",
  selectTransaction: "Select transaction",
  selectOneTransaction: "Select one transaction",
  limitSpendHint:
    "Limit {{limit}} · spent this month {{spent}} · remaining {{remaining}}",
  limitSpendOverHint:
    "Limit {{limit}} · spent this month {{spent}} · {{over}} over limit",
  debtLedgerSourceHint:
    "This transaction is the source record for this {{type}}. Go to Debts to settle or edit details.",
  settleDebtOptionLabel: "{{person}} · {{type}} · remaining {{amount}}",
  duplicateRowsRemoved:
    "{{count}} duplicate transactions removed from the list",
};
