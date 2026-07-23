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
  attachEmptySettlement:
    "تراکنش تسویه هم‌ارز پیدا نشد. برای {{kind}} باید تراکنش {{txType}} با ارز {{currency}} ثبت کنید (و قبلاً به طلب/بدهی دیگری وصل نشده باشد).",
  attachEmptySource:
    "تراکنش مبدأ هم‌ارز پیدا نشد. برای {{kind}} باید تراکنش {{txType}} با ارز {{currency}} ثبت کنید.",
  existingActiveTitle:
    "از قبل {{count}} مورد فعال به نام «{{person}}» هست",
  existingActiveHint:
    "برای جلوگیری از ثبت تکراری، یکی از موارد موجود را برای تسویه انتخاب کنید یا اگر واقعاً تعهد جدیدی است، ایجاد جدید را بزنید.",
  linkToExisting: "لینک و تسویه با این مورد",
  createNewAnyway: "ایجاد طلب/بدهی جدید",
  creatingNewConfirmed: "در حال ثبت مورد جدید برای این نام هستید.",
  showExistingAgain: "نمایش موارد موجود",
  chooseLinkOrCreate:
    "از قبل {{count}} مورد فعال به نام «{{person}}» هست. لینک به موجود را انتخاب کنید یا «ایجاد جدید» را بزنید.",
};
