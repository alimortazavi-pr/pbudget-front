import priceGenerator from "price-generator";

import { toEnglishDigits, toPersianDigits } from "./persian-digits";

/** Raw digits (and optional leading minus) for API payloads. */
export function parsePriceInput(value: string, allowNegative = false): string {
  const english = toEnglishDigits(value).trim();
  const negative = allowNegative && english.startsWith("-");
  const digits = english.replace(/\D/g, "");
  if (!digits) return negative ? "-" : "";
  return negative ? `-${digits}` : digits;
}

/** Formatted display for price inputs (Persian digits + thousand separators). */
export function formatPriceInput(
  value: string | number,
  allowNegative = false,
): string {
  const parsed = parsePriceInput(String(value), allowNegative);
  if (!parsed || parsed === "-") return parsed;

  const negative = parsed.startsWith("-");
  const digits = negative ? parsed.slice(1) : parsed;
  if (!digits) return negative ? "-" : "";

  const formatted = toPersianDigits(priceGenerator(digits));
  return negative ? `-${formatted}` : formatted;
}
