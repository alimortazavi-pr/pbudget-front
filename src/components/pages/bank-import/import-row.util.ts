import type { ICategory } from "@/common/interfaces/category.interface";
import type { IParsedBankRow } from "@/common/interfaces/bank.interface";
import { resolveDefaultPaymentCardId } from "@/common/utils/default-payment-card";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { DebtLedgerMode } from "@/components/pages/budget/DebtLedgerSection";
import { DebtType, BudgetType } from "@/types/enums";
import type { ImportRowDraft, ImportRowExtras } from "./import-row.types";

const initialDebtLedger = {
  enabled: false,
  mode: "create" as DebtLedgerMode,
  debtType: String(DebtType.RECEIVABLE),
  person: "",
  settleDebtId: "",
};

export function createImportRowDraft(
  row: IParsedBankRow,
  paymentCards: IPaymentCard[],
  userId?: string,
): ImportRowDraft {
  const type = String(row.type);
  const defaultCardId =
    type === String(BudgetType.COST)
      ? resolveDefaultPaymentCardId(paymentCards, userId)
      : "";

  return {
    ...row,
    selected: !row.isDuplicate,
    price: String(row.price),
    type,
    year: String(row.year),
    month: String(row.month),
    day: String(row.day),
    categoryId: "",
    description: row.description,
    paymentCardId: defaultCardId,
    projectLedger: { enabled: false, projectId: "" },
    ventureLedger: { enabled: false, ventureId: "" },
    debtLedger: { ...initialDebtLedger },
  };
}

export function isImportRowConfigured(row: ImportRowDraft) {
  return Boolean(row.categoryId.trim());
}

export function buildImportRowSummary(
  row: ImportRowDraft,
  categories: ICategory[],
  paymentCards: IPaymentCard[],
) {
  const parts: string[] = [];
  const category = categories.find((item) => item._id === row.categoryId);
  if (category) parts.push(category.title);

  const card = paymentCards.find((item) => item._id === row.paymentCardId);
  if (card) parts.push(card.title);

  if (row.projectLedger.enabled && row.projectLedger.projectId) {
    parts.push("پروژه");
  }
  if (row.ventureLedger.enabled && row.ventureLedger.ventureId) {
    parts.push("کسب‌وکار");
  }
  if (row.debtLedger.enabled) {
    parts.push(row.debtLedger.mode === "create" ? "طلب/بدهی" : "تسویه");
  }

  return parts;
}

function isSettleDebtMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

export function validateImportRowDraft(row: ImportRowDraft): string | null {
  if (!row.price.trim() || !row.categoryId.trim()) {
    return "مبلغ و دسته‌بندی الزامی است";
  }
  if (!row.year || !row.month || !row.day) {
    return "تاریخ الزامی است";
  }
  if (row.ventureLedger.enabled && row.projectLedger.enabled && row.projectLedger.projectId) {
    return "تراکنش نمی‌تواند هم‌زمان به پروژه و کسب‌وکار وصل شود";
  }
  if (row.ventureLedger.enabled && !row.ventureLedger.ventureId) {
    return "کسب‌وکار را انتخاب کنید";
  }
  if (row.debtLedger.enabled) {
    if (row.debtLedger.mode === "create" && !row.debtLedger.person.trim()) {
      return "نام طرف حساب الزامی است";
    }
    if (isSettleDebtMode(row.debtLedger.mode) && !row.debtLedger.settleDebtId) {
      return "طلب یا بدهی مورد نظر را انتخاب کنید";
    }
  }
  return null;
}

export function buildImportRowExtras(row: ImportRowDraft): ImportRowExtras {
  const extras: ImportRowExtras = {};

  if (row.paymentCardId) extras.paymentCardId = row.paymentCardId;
  if (row.projectLedger.enabled && row.projectLedger.projectId) {
    extras.projectId = row.projectLedger.projectId;
  }
  if (row.ventureLedger.enabled && row.ventureLedger.ventureId) {
    extras.ventureId = row.ventureLedger.ventureId;
  }
  if (row.debtLedger.enabled) {
    extras.debt = {
      enabled: true,
      mode: row.debtLedger.mode,
      debtType: row.debtLedger.debtType,
      person: row.debtLedger.person.trim() || undefined,
      settleDebtId: row.debtLedger.settleDebtId || undefined,
    };
  }

  return extras;
}

export function buildConfirmPayloadRow(row: ImportRowDraft) {
  return {
    tempId: row.tempId,
    price: Number(row.price),
    type: Number(row.type),
    year: Number(row.year),
    month: Number(row.month),
    day: Number(row.day),
    description: row.description,
    statementRef: row.statementRef,
    categoryId: row.categoryId,
    ...buildImportRowExtras(row),
  };
}
