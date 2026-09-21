import { tomanToDisplayAmount } from "./money-display";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/** Display-only: counts, stats, plain integers in the UI */
export function formatCount(value: number | string): string {
  return toPersianDigits(value);
}

export function formatPrice(amount: number | string): string {
  const parsed = typeof amount === "string" ? Number(amount) : amount;
  const num = tomanToDisplayAmount(parsed);
  if (Number.isNaN(num)) return toPersianDigits("0");
  return toPersianDigits(
    num.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  );
}
