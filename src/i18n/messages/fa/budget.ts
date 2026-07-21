import type { MessageTree } from "../../types";

export const budgetMessages: MessageTree = {
  editTransaction: "ویرایش تراکنش",
  newTransaction: "ثبت تراکنش جدید",
  createCategory: "ایجاد دسته‌بندی",
  income: "دریافتی",
  expense: "پرداختی",
  amountWithCurrency: "مبلغ ({{currency}})",
  dateGregorian: "تاریخ (میلادی)",
  dateJalali: "تاریخ (شمسی)",
  bankImportBulkLink: "ورود گروهی از صورتحساب بانک",
  paymentCardSource: "کارت پرداخت (مبدا)",
  paymentCardDestination: "کارت دریافت (مقصد)",
  noCard: "بدون کارت",
  noCardRegistered: "کارتی ثبت نشده",
  noCardsYetPrefix: "هنوز کارتی ثبت نکرده‌اید. از",
  myCardsLink: "کارت‌های من",
  noCardsYetSuffix: "اضافه کنید.",
  projectLedgerTitle: "ثبت تراکنش در حساب یک پروژه مشخص",
  projectLedgerCategoryHint:
    "با دسته «{{category}}» این تراکنش خودکار به پروژه مرتبط وصل می‌شود.",
  projectLedgerVisibility:
    "تراکنش در صفحه پروژه و گزارش‌های مالی آن نمایش داده می‌شود.",
  noTransactionsInRange: "تراکنشی برای این بازه پیدا نشد",
  attachTransactions: "وصل کردن {{count}} تراکنش",
  selectTransaction: "تراکنش انتخاب کنید",
  selectOneTransaction: "یک تراکنش انتخاب کنید",
  limitSpendHint:
    "سقف {{limit}} · خرج این ماه {{spent}} · مانده {{remaining}}",
  limitSpendOverHint:
    "سقف {{limit}} · خرج این ماه {{spent}} · {{over}} بیش از سقف",
  debtLedgerSourceHint:
    "این تراکنش منبع ثبت این {{type}} است. برای تسویه یا ویرایش جزئیات به صفحه طلب و بدهی بروید.",
  settleDebtOptionLabel: "{{person}} · {{type}} · مانده {{amount}}",
  duplicateRowsRemoved:
    "{{count}} تراکنش تکراری — از لیست حذف شده‌اند",
  dateRangeTitle: "بازه روز",
  dateRangeHint: "مثلاً از ۱ تا ۲۰ برای لغو انتخاب روزهایی که قبلاً وارد کرده‌اید",
  fromDay: "از روز",
  toDay: "تا روز",
  selectRange: "انتخاب بازه",
  unselectRange: "لغو انتخاب بازه",
  rangeInvalid: "بازه روز نامعتبر است",
  rangeAppliedSelect: "{{count}} تراکنش در بازه انتخاب شد",
  rangeAppliedUnselect: "{{count}} تراکنش در بازه از انتخاب خارج شد",
  rangeNoMatch: "تراکنشی در این بازه پیدا نشد",
};
