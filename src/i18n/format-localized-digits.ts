import type { Language } from "./types";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function formatLocalizedDigits(
  value: string | number,
  language: Language,
): string {
  const text = String(value);
  if (language === "en") return text;
  const digits = language === "ar" ? ARABIC_DIGITS : PERSIAN_DIGITS;
  return text.replace(/\d/g, (d) => digits[Number(d)] ?? d);
}
