import { toEnglishDigits, toPersianDigits } from "@/common/utils/persian-digits";

/** "2.5" -> "۲٫۵" (up to 6 decimals, thousands separated). */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return toPersianDigits("0");
  return toPersianDigits(value.toLocaleString("en-US", { maximumFractionDigits: 6 })).replace(/\./g, "٫");
}

/** Keeps only digits and one decimal point while typing (Persian digits accepted). */
export function sanitizeQuantityInput(raw: string): string {
  const english = toEnglishDigits(raw).replace(/[٫,،]/g, ".");
  const cleaned = english.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 6)}` : whole;
}

export function formatPercent(value: number): string {
  return toPersianDigits(Math.abs(value).toFixed(1)).replace(/\./g, "٫");
}
