import type { MessageTree } from "../../types";

export const errorsMessages: MessageTree = {
  internalServer: "خطای داخلی سرور",
  invalidTransactionType: "نوع تراکنش (دریافتی/پرداختی) نامعتبر است",
  remindDaysRange: "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد",
  dueDayRange: "روز سررسید باید بین ۱ تا ۳۱ باشد",
  fieldInvalidFormat: "{{field}} فرمت نامعتبر است",
  fieldMustBeNumber: "{{field}} باید عدد باشد",
  fieldRequired: "{{field}} الزامی است",
  fieldMustNotBeGreater: "{{field}} نباید بیشتر از {{bound}} باشد",
  fieldMustNotBeLess: "{{field}} نباید کمتر از {{bound}} باشد",
  default: "خطا",
  fields: {
    remindDaysBefore: "تعداد روز یادآوری",
    dueDayOfMonth: "روز سررسید",
    title: "عنوان",
    amount: "مبلغ",
    monthlyLimit: "سقف ماهانه",
    price: "مبلغ",
    categoryId: "دسته‌بندی",
    parentId: "دسته والد",
    color: "رنگ",
    email: "ایمیل",
    password: "رمز عبور",
  },
};
