import type { Language, TranslationParams } from "./types";
import { allMessages } from "./messages";
import { formatLocalizedDigits } from "./format-localized-digits";

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

function interpolate(
  text: string,
  params: TranslationParams | undefined,
  language: Language,
): string {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [key, value]) => {
    const formatted =
      typeof value === "number"
        ? formatLocalizedDigits(value, language)
        : typeof value === "string" && /\d/.test(value)
          ? formatLocalizedDigits(value, language)
          : String(value);
    return acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), formatted);
  }, text);
}

export function createTranslator(language: Language, mounted = true) {
  const catalog = mounted ? allMessages[language] : allMessages.fa;

  return function t(key: string, params?: TranslationParams): string {
    const resolvedKey = labelToKeyMap[key] ?? key;
    const text =
      catalog[resolvedKey] ??
      allMessages.fa[resolvedKey] ??
      (labelToKeyMap[key] ? undefined : catalog[key]) ??
      allMessages.fa[key] ??
      key;
    return interpolate(text, params, language);
  };
}

let globalLanguage: Language = "fa";
let globalMounted = false;

export function setI18nState(language: Language, mounted: boolean) {
  globalLanguage = language;
  globalMounted = mounted;
}

export function getTranslator() {
  return createTranslator(globalLanguage, globalMounted);
}
