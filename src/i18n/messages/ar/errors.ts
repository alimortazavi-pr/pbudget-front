import type { MessageTree } from "../../types";

export const errorsMessages: MessageTree = {
  internalServer: "خطأ داخلي في الخادم",
  invalidTransactionType: "نوع المعاملة (دخل/مصروف) غير صالح",
  remindDaysRange: "يجب أن تكون أيام التذكير بين ٠ و٣٠",
  dueDayRange: "يجب أن يكون يوم الاستحقاق بين ١ و٣١",
  fieldInvalidFormat: "تنسيق {{field}} غير صالح",
  fieldMustBeNumber: "يجب أن يكون {{field}} رقماً",
  fieldRequired: "{{field}} مطلوب",
  fieldMustNotBeGreater: "يجب ألا يتجاوز {{field}} {{bound}}",
  fieldMustNotBeLess: "يجب ألا يقل {{field}} عن {{bound}}",
  default: "خطأ",
  fields: {
    remindDaysBefore: "أيام التذكير",
    dueDayOfMonth: "يوم الاستحقاق",
    title: "العنوان",
    amount: "المبلغ",
    monthlyLimit: "الحد الشهري",
    price: "المبلغ",
    categoryId: "الفئة",
    parentId: "الفئة الأب",
    color: "اللون",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
  },
};
