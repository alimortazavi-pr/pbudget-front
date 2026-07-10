import type { MessageTree } from "../../types";

export const budgetMessages: MessageTree = {
  editTransaction: "تعديل المعاملة",
  newTransaction: "معاملة جديدة",
  createCategory: "إنشاء فئة",
  income: "دخل",
  expense: "مصروف",
  amountWithCurrency: "المبلغ ({{currency}})",
  dateGregorian: "التاريخ (ميلادي)",
  dateJalali: "التاريخ (هجري)",
  bankImportBulkLink: "استيراد جماعي من كشف حساب بنكي",
  paymentCardSource: "بطاقة الدفع (المصدر)",
  paymentCardDestination: "بطاقة الاستلام (الوجهة)",
  noCard: "بدون بطاقة",
  noCardRegistered: "لا توجد بطاقات مسجلة",
  noCardsYetPrefix: "لم تُسجّل أي بطاقة بعد. من",
  myCardsLink: "بطاقاتي",
  noCardsYetSuffix: "أضف بطاقة.",
};
