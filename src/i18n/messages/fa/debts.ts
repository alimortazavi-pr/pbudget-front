import type { MessageTree } from "../../types";

export const debtsMessages: MessageTree = {
  settled: "تسویه‌شده",
  remaining: "باقی‌مانده",
  sourceDetached: "اتصال مبدأ قطع شد",
  settlementDetached: "تسویه جدا شد",
  detachSettlement: "جدا کردن تسویه",
  attachSource: "وصل تراکنش مبدأ",
  attachSettlement: "وصل تراکنش تسویه",
  settle: "تسویه",
  registerSettlement: "ثبت تسویه",
  registerSettlements: "ثبت {{count}} تسویه",
  noMatchingTransaction: "تراکنش مناسبی پیدا نشد. ابتدا تراکنش",
  incomeDeposit: "دریافتی (واریز)",
  costWithdraw: "پرداختی (برداشت)",
  registerFirst: "ثبت کنید.",
};
