import type { UserCurrency } from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import type { ParsedSms } from "@/common/utils/sms-parser";
import { t } from "@/i18n";

/** "خرج ۵۰٬۰۰۰ تومان — کارت ****۱۲۳۴" */
export function smsPreviewLine(parsed: ParsedSms, currency: UserCurrency): string {
  const kind = parsed.type === "cost" ? t("budget.expense") : t("budget.income");
  const amount = formatPriceWithCurrency(parsed.price, currency);
  const card = parsed.cardLast4 ? ` — ${t("feat.sms.cardLine", { last4: toPersianDigits(parsed.cardLast4) })}` : "";
  return `${kind} ${amount}${card}`;
}

/** The balance from the SMS in the user's currency unit (rial -> toman). */
export function smsBalanceInUserUnit(parsed: ParsedSms, currency: UserCurrency): number | null {
  if (parsed.balance == null) return null;
  return currency === "toman" && parsed.amountUnit === "rial" ? parsed.balance / 10 : parsed.balance;
}
