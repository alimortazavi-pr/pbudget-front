import { toPersianDigits } from "./persian-digits";
import { getActiveLanguage } from "@/i18n/translate";
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

/** Localized number only (no unit) — for layouts that show the unit separately. */
export function formatAmountOnly(
  amount: number | string,
  currency?: UserCurrency | null,
) {
  const resolved = resolveBudgetCurrency(currency);
  const parsed = typeof amount === "string" ? Number(amount) : amount;
  const num = shouldConvertToman(resolved) ? tomanToDisplayAmount(parsed) : parsed;
  if (Number.isNaN(num)) return toPersianDigits("0");
  return toPersianDigits(num.toLocaleString("en-US", { maximumFractionDigits: 2 }));
}

/** Very large amounts as "۸٫۴۹ میلیارد" so cards stay readable; the full value is shown on hover/tap. */
export function formatCompactAmount(amount: number, currency?: UserCurrency | null) {
  const resolved = resolveBudgetCurrency(currency);
  const converted = shouldConvertToman(resolved) ? tomanToDisplayAmount(amount) : amount;
  const abs = Math.abs(converted);
  if (abs < 1_000_000_000) return formatAmountOnly(amount, currency);
  const language = getActiveLanguage();
  const [divisor, word] =
    abs >= 1_000_000_000_000
      ? [1_000_000_000_000, language === "en" ? "T" : language === "ar" ? "تريليون" : "تریلیون"]
      : [1_000_000_000, language === "en" ? "B" : language === "ar" ? "مليار" : "میلیارد"];
  const short = (converted / divisor).toFixed(2).replace(/\.?0+$/, "");
  return `${toPersianDigits(short)}${language === "en" ? "" : " "}${word}`;
}
