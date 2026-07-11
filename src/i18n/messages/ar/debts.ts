import type { MessageTree } from "../../types";

export const debtsMessages: MessageTree = {
  settled: "تمت التسوية",
  remaining: "المتبقي",
  sourceDetached: "تم فصل المعاملة المصدر",
  settlementDetached: "تم فصل التسوية",
  detachSettlement: "فصل التسوية",
  attachSource: "ربط المعاملة المصدر",
  attachSettlement: "ربط معاملة التسوية",
  settle: "تسوية",
  registerSettlement: "تسجيل التسوية",
  registerSettlements: "تسجيل {{count}} تسويات",
  noMatchingTransaction: "لم يُعثر على معاملة مناسبة. سجّل أولاً معاملة",
  incomeDeposit: "وارد (إيداع)",
  costWithdraw: "صادر (سحب)",
  registerFirst: ".",
};
