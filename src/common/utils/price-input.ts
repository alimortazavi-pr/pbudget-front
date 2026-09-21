import priceGenerator from "price-generator";

import type { UserCurrency } from "@/common/constants/user-preferences";
import {
  displayAmountToToman,
  tomanToDisplayAmount,
} from "./money-display";
import { toEnglishDigits, toPersianDigits } from "./persian-digits";

function parseDisplayedNumber(value: string, allowNegative: boolean) {
  const english = toEnglishDigits(value)
    .replace(/[٫،]/g, ".")
    .trim();
  const negative = allowNegative && english.startsWith("-");
  const unsigned = english.replace(/^-/, "");
  const normalized = unsigned.replace(/,/g, "");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return negative ? -0 : null;
  const parsed = Number(match[0]);
  return negative ? -parsed : parsed;
}

function canonicalNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  if (Object.is(value, -0)) return "-";
  return String(Number(value.toFixed(3)));
}

/** Parse a displayed amount back to the canonical toman value for the API. */
export function parsePriceInput(
  value: string,
  allowNegative = false,
  currency: UserCurrency = "toman",
): string {
  const parsed = parseDisplayedNumber(value, allowNegative);
  if (parsed == null || Object.is(parsed, -0)) return parsed == null ? "" : "-";
  return canonicalNumber(
    currency === "toman" ? displayAmountToToman(parsed) : parsed,
  );
}

/** Formatted display for price inputs (Persian digits + thousand separators). */
export function formatPriceInput(
  value: string | number,
  allowNegative = false,
  currency: UserCurrency = "toman",
): string {
  const parsed = parseDisplayedNumber(String(value), allowNegative);
  if (parsed == null || Object.is(parsed, -0)) {
    return parsed == null ? "" : "-";
  }

  const display = currency === "toman" ? tomanToDisplayAmount(parsed) : parsed;
  const negative = display < 0;
  const absolute = Math.abs(display);
  const formatted = toPersianDigits(
    priceGenerator(String(Number(absolute.toFixed(3)))),
  );

  return negative ? `-${formatted}` : formatted;
}
