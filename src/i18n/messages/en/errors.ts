import type { MessageTree } from "../../types";

export const errorsMessages: MessageTree = {
  internalServer: "Internal server error",
  invalidTransactionType: "Invalid transaction type (income/expense)",
  remindDaysRange: "Reminder days must be between 0 and 30",
  dueDayRange: "Due day must be between 1 and 31",
  fieldInvalidFormat: "{{field}} has an invalid format",
  fieldMustBeNumber: "{{field}} must be a number",
  fieldRequired: "{{field}} is required",
  fieldMustNotBeGreater: "{{field}} must not be greater than {{bound}}",
  fieldMustNotBeLess: "{{field}} must not be less than {{bound}}",
  default: "Error",
  fields: {
    remindDaysBefore: "Reminder days",
    dueDayOfMonth: "Due day of month",
    title: "Title",
    amount: "Amount",
    monthlyLimit: "Monthly limit",
    price: "Amount",
    categoryId: "Category",
    parentId: "Parent category",
    color: "Color",
    email: "Email",
    password: "Password",
  },
};
