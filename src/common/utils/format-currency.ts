import { toPersianDigits } from "./persian-digits";
import {
  currencyShortLabel,
  resolveBudgetCurrency,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import {
  moneyDisplayUnitLabel,
  shouldConvertToman,
  tomanToDisplayAmount,
} from "./money-display";

export function formatPriceWithCurrency(
  amount: number | string,
  currency?: UserCurrency | null,
) {
  const resolved = resolveBudgetCurrency(currency);
  const parsed = typeof amount === "string" ? Number(amount) : amount;
  const num = shouldConvertToman(resolved)
    ? tomanToDisplayAmount(parsed)
    : parsed;
  if (Number.isNaN(num)) {
    const label = resolved === "toman" ? moneyDisplayUnitLabel() : currencyShortLabel(resolved);
    return `${toPersianDigits("0")} ${label}`;
  }
  const formatted = toPersianDigits(
    num.toLocaleString("en-US", { maximumFractionDigits: 2 }),
  );
  if (resolved === "usd") return `$${formatted}`;
  if (resolved === "dinar") return `${formatted} ${currencyShortLabel(resolved)}`;
  return `${formatted} ${moneyDisplayUnitLabel()}`;
}

/** Backward-compatible: defaults to toman when currency omitted */
export function formatPriceForUser(
  amount: number | string,
  currency?: UserCurrency | null,
) {
  return formatPriceWithCurrency(amount, currency ?? "toman");
}
