import axios from "axios";

const API_ERROR_TRANSLATIONS: Record<string, string> = {
  "Internal server error": "خطای سرور — لطفاً دوباره تلاش کنید",
  "Please enter the 'Type (0 or 1)' correctly": "نوع تراکنش (دریافتی/پرداختی) نامعتبر است",
  "Please enter the 'type (0 or 1)' correctly": "نوع تراکنش (دریافتی/پرداختی) نامعتبر است",
  "remindDaysBefore must not be greater than 30": "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد",
  "remindDaysBefore must not be less than 0": "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد",
  "روز سررسید باید بین ۱ تا ۳۱ باشد": "روز سررسید باید بین ۱ تا ۳۱ باشد",
  "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد": "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد",
};

const VALIDATION_KEY_TRANSLATIONS: Record<string, string> = {
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
};

function fieldLabel(field: string): string {
  return VALIDATION_KEY_TRANSLATIONS[field] ?? field;
}

function translateValidationKeyMessage(message: string): string | null {
  const mustBeString = message.match(/^(\w+)\s+must be a string$/i);
  if (mustBeString) {
    return `${fieldLabel(mustBeString[1])} فرمت نامعتبر است`;
  }

  const mustBeNumber = message.match(/^(\w+)\s+must be (?:a )?number/i);
  if (mustBeNumber) {
    return `${fieldLabel(mustBeNumber[1])} باید عدد باشد`;
  }

  const mustNotBeEmpty = message.match(/^(\w+)\s+should not be empty$/i);
  if (mustNotBeEmpty) {
    return `${fieldLabel(mustNotBeEmpty[1])} الزامی است`;
  }

  const match = message.match(/^(\w+)\s+must not be (greater than|less than)\s+(.+)$/i);
  if (!match) return null;

  const [, field, direction, bound] = match;
  const label = fieldLabel(field);
  if (direction === "greater than") {
    return `${label} نباید بیشتر از ${bound} باشد`;
  }
  return `${label} نباید کمتر از ${bound} باشد`;
}

function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  if (API_ERROR_TRANSLATIONS[trimmed]) {
    return API_ERROR_TRANSLATIONS[trimmed];
  }
  return translateValidationKeyMessage(trimmed) ?? trimmed;
}

function normalizeMessagePayload(message: unknown): string | null {
  if (typeof message === "string" && message.trim()) {
    return translateApiMessage(message);
  }

  if (Array.isArray(message)) {
    const parts = message
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map(translateApiMessage);
    const unique = [...new Set(parts)];
    if (unique.length > 0) return unique.join(" · ");
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback = "خطا"): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown } | undefined;
    const fromPayload = normalizeMessagePayload(payload?.message);
    if (fromPayload) return fromPayload;
  }

  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
    return error.message;
  }

  return fallback;
}
