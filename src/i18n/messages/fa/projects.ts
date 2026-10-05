import type { MessageTree } from "../../types";

export const projectsMessages: MessageTree = {
  clockOutRecorded: "خروج ثبت شد",
  editProject: "ویرایش پروژه",
  projectSaved: "پروژه ذخیره شد",
  monthlySalaryLabel: "حقوق ماهانه ({{currency}})",
  contractTotalLabel: "مبلغ کل قرارداد ({{currency}})",
  hourlyRateLabel: "نرخ ساعتی کار ({{currency}})",
  clockInWithDetail: "ورود ثبت شد · {{detail}}",
  progressExpenseLine: "{{percent}}٪ · پرداختی {{amount}}",
  incomePerHourLine: "{{amount}} / ساعت (واقعی)",
  contractRateLine: "نرخ قرارداد: {{amount}} / ساعت",
  monthTargetSuffix: " · هدف {{duration}}",
  dailyHoursPassed:
    "ساعت روزانه «{{project}}» گذشت — خروج را ثبت کنید",
  dailyHoursPassedReminder:
    "۳۰ دقیقه از پایان ساعت روزانه «{{project}}» گذشت — خروج را ثبت کنید",
  detachTransaction: "جدا کردن از پروژه",
  detachTransactionConfirm: "این تراکنش از پروژه جدا شود؟ خود تراکنش و موجودی کیف پول تغییری نمی‌کنند.",
  transactionDetached: "تراکنش از پروژه جدا شد",
};
