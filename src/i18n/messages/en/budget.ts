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
};
