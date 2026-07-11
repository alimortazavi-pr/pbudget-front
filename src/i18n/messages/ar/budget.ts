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
  projectLedgerTitle: "تسجيل معاملة ضمن مشروع محدد",
  projectLedgerCategoryHint:
    "مع الفئة «{{category}}» تُربط هذه المعاملة تلقائياً بالمشروع.",
  projectLedgerVisibility:
    "تظهر المعاملة في صفحة المشروع وتقاريره المالية.",
  noTransactionsInRange: "لا توجد معاملات في هذه الفترة",
  attachTransactions: "ربط {{count}} معاملات",
  selectTransaction: "اختر معاملة",
  selectOneTransaction: "اختر معاملة واحدة",
  limitSpendHint:
    "السقف {{limit}} · مصروف هذا الشهر {{spent}} · المتبقي {{remaining}}",
  limitSpendOverHint:
    "السقف {{limit}} · مصروف هذا الشهر {{spent}} · {{over}} فوق السقف",
  debtLedgerSourceHint:
    "هذه المعاملة هي سجل مصدر هذا {{type}}. انتقل إلى الديون للتسوية أو التعديل.",
  settleDebtOptionLabel: "{{person}} · {{type}} · المتبقي {{amount}}",
  duplicateRowsRemoved: "تمت إزالة {{count}} معاملات مكررة من القائمة",
};
