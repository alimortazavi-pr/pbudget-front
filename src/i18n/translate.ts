import type { TranslationParams } from "./types";
import { messages } from "./messages";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Latin digits → Persian digits. */
export function persianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** Maps legacy Persian labels / nav strings to dot-notation keys */
export const labelToKeyMap: Record<string, string> = {
  خانه: "nav.home",
  "ورود از بانک": "nav.bankImport",
  "ورود از صورتحساب بانک": "nav.bankImportFull",
  "تحلیل مالی": "nav.financialAnalysis",
  "صندوق‌ها": "nav.boxes",
  "کارت‌های من": "nav.myCards",
  "دسته‌بندی‌ها": "nav.categories",
  "برنامه روزانه": "nav.dailyPlanner",
  "یادداشت‌ها": "nav.notes",
  "پروژه‌ها": "nav.projects",
  "کسب‌وکار و شرکا": "nav.businessPartners",
  "شرکا و تسویه": "nav.businessPartners",
  "حضور و غیاب": "nav.workAttendance",
  "حضور فریلنسری": "nav.workAttendance",
  "طلب و بدهی": "nav.debts",
  اقساط: "nav.installments",
  "چک‌ها": "nav.checks",
  "تعهدات جاری": "nav.commitments",
  پروفایل: "nav.profile",
  تنظیمات: "nav.settings",
  "بات تلگرام": "nav.telegramBot",
  بیشتر: "nav.more",
  ثبت: "nav.create",
  "ثبت تراکنش": "nav.createTransaction",
  "دانلود اپ": "nav.downloadApp",
  "برنامه‌ریزی": "nav.planning",
  "مالی پیشرفته": "nav.advancedFinance",
  مشارکت: "nav.partnership",
  "میز شخصی": "nav.personalDesk",
  اصلی: "nav.primary",
  داشبورد: "nav.dashboard",
};

function interpolate(text: string, params: TranslationParams | undefined): string {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [key, value]) => {
    const formatted =
      typeof value === "number" || /\d/.test(String(value))
        ? persianDigits(value)
        : String(value);
    return acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), formatted);
  }, text);
}

/** Looks up a Persian UI string by key (or legacy Persian label) and fills `{{params}}`. */
export function t(key: string, params?: TranslationParams): string {
  const resolvedKey = labelToKeyMap[key] ?? key;
  const text = messages[resolvedKey] ?? messages[key] ?? key;
  return interpolate(text, params);
}

/** Same `t`, for module-level code that used to need a language-aware translator. */
export function getTranslator() {
  return t;
}
