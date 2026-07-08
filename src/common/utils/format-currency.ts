import { toPersianDigits } from "./persian-digits";
import {
  currencyShortLabel,
  resolveBudgetCurrency,
  type UserCurrency,
} from "@/common/constants/user-preferences";

export function formatPriceWithCurrency(
  amount: number | string,
  currency?: UserCurrency | null,
) {
  const resolved = resolveBudgetCurrency(currency);
  const num = typeof amount === "string" ? parseInt(amount, 10) : amount;
  if (Number.isNaN(num)) {
    return `${toPersianDigits("0")} ${currencyShortLabel(resolved)}`;
  }
  const formatted = toPersianDigits(num.toLocaleString("en-US"));
  if (resolved === "usd") return `$${formatted}`;
  if (resolved === "dinar") return `${formatted} ${currencyShortLabel(resolved)}`;
  return `${formatted} ${currencyShortLabel(resolved)}`;
}

/** Backward-compatible: uses تومان when currency omitted */
export function formatPriceForUser(
  amount: number | string,
  currency?: UserCurrency | null,
) {
  return formatPriceWithCurrency(amount, currency ?? "toman");
}
