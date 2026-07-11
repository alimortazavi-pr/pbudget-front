import { getTranslator } from "@/i18n";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IParsedBankRow } from "@/common/interfaces/bank.interface";
import { resolveDefaultPaymentCardId } from "@/common/utils/default-payment-card";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { DebtLedgerMode } from "@/components/pages/budget/DebtLedgerSection";
import { DebtType, BudgetType } from "@/types/enums";
import type { ImportRowDraft, ImportRowExtras } from "./import-row.types";

const t = getTranslator();

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
    parts.push(t("auto.kcce7e8ff41"));
  }
  if (row.ventureLedger.enabled && row.ventureLedger.ventureId) {
    parts.push(t("auto.k9f48ae23bb"));
  }
  if (row.debtLedger.enabled) {
    parts.push(row.debtLedger.mode === "create" ? t("auto.k4ffe94cc2d") : t("auto.k43ef5d91de"));
  }

  return parts;
}

function isSettleDebtMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

export function validateImportRowDraft(row: ImportRowDraft): string | null {
  if (!row.price.trim() || !row.categoryId.trim()) {
    return t("auto.k50d12ee110");
  }
  if (!row.year || !row.month || !row.day) {
    return t("auto.k902b7818a3");
  }
  if (row.ventureLedger.enabled && row.projectLedger.enabled && row.projectLedger.projectId) {
    return t("auto.kbb8ead2cfd");
  }
  if (row.ventureLedger.enabled && !row.ventureLedger.ventureId) {
    return t("auto.k3a896c6fbf");
  }
  if (row.debtLedger.enabled) {
    if (row.debtLedger.mode === "create" && !row.debtLedger.person.trim()) {
      return t("auto.ka7190d81dc");
    }
    if (isSettleDebtMode(row.debtLedger.mode) && !row.debtLedger.settleDebtId) {
      return t("auto.k55cf141e8e");
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
