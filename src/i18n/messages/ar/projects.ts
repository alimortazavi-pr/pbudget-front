import type { MessageTree } from "../../types";

export const projectsMessages: MessageTree = {
  clockOutRecorded: "تم تسجيل الخروج",
  editProject: "تعديل المشروع",
  projectSaved: "تم حفظ المشروع",
  monthlySalaryLabel: "الراتب الشهري ({{currency}})",
  contractTotalLabel: "إجمالي العقد ({{currency}})",
  hourlyRateLabel: "الأجر بالساعة ({{currency}})",
  clockInWithDetail: "تم تسجيل الدخول · {{detail}}",
  progressExpenseLine: "{{percent}}٪ · مصروف {{amount}}",
  incomePerHourLine: "{{amount}} / ساعة (فعلي)",
  contractRateLine: "سعر العقد: {{amount}} / ساعة",
  monthTargetSuffix: " · الهدف {{duration}}",
  dailyHoursPassed:
    "انتهت ساعات اليوم لـ «{{project}}» — سجّل الخروج",
  dailyHoursPassedReminder:
    "مرّ ٣٠ دقيقة على نهاية ساعات اليوم لـ «{{project}}» — سجّل الخروج",
};
