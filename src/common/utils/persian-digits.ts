import { tomanToDisplayAmount } from "./money-display";
import { AMOUNT_MASK, areAmountsHidden } from "./amount-privacy";
import { formatLocalizedDigits } from "@/i18n/format-localized-digits";
import { getActiveLanguage } from "@/i18n/translate";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Digits in the user's UI language (Persian, Arabic-Indic or Latin). */
export function toPersianDigits(value: string | number): string {
  return formatLocalizedDigits(value, getActiveLanguage());
}

/** Normalizes Persian and Arabic-Indic digits to ASCII. */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** Display-only: counts, stats, plain integers in the UI */
export function formatCount(value: number | string): string {
  return toPersianDigits(value);
}

/** Product prices (plans), which are not the user's money and are never masked. */
export function formatPlanPrice(amount: number | string): string {
  const parsed = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(parsed)) return toPersianDigits("0");
  return toPersianDigits(parsed.toLocaleString("en-US", { maximumFractionDigits: 2 }));
}

export function formatPrice(amount: number | string): string {
  if (areAmountsHidden()) return AMOUNT_MASK;
  const parsed = typeof amount === "string" ? Number(amount) : amount;
  const num = tomanToDisplayAmount(parsed);
  if (Number.isNaN(num)) return toPersianDigits("0");
  return toPersianDigits(
    num.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  );
}
