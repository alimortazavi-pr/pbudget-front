import { moneyDisplayUnitLabel, tomanToDisplayAmount } from "@/common/utils/money-display";
import type { UserSubscription } from "@/common/interfaces/subscription.interface";
import { formatNumberFa } from "../ui/admin-format";

/** Server amounts are tomans; this converts once to the admin's display unit. */
export function formatTomanFa(amountToman: number) {
  return `${formatNumberFa(Math.round(tomanToDisplayAmount(Number(amountToman) || 0)))} ${moneyDisplayUnitLabel()}`;
}

/** Compact money for tiles and chart axes: ۱٫۲ میلیون، ۳۵۰ هزار. */
export function formatTomanShortFa(amountToman: number, withUnit = true) {
  const value = tomanToDisplayAmount(Number(amountToman) || 0);
  const abs = Math.abs(value);
  const fmt = (n: number) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(n);
  const text = abs >= 1e9 ? `${fmt(value / 1e9)} میلیارد` : abs >= 1e6 ? `${fmt(value / 1e6)} میلیون` : abs >= 1e3 ? `${fmt(value / 1e3)} هزار` : fmt(value);
  return withUnit ? `${text} ${moneyDisplayUnitLabel()}` : text;
}

/** Plan prices are shown in the plan's own unit (never converted). */
export function formatPlanAmountFa(amount: number, unit?: string | null) {
  return `${formatNumberFa(amount)} ${unit || "تومان"}`;
}

/** Relative change; null when there is no base to compare with. */
export function deltaOf(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return (current - previous) / previous;
}

export function formatRateFa(rate: number) {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(rate * 100)}٪`;
}

export const SOURCE_LABEL: Record<string, string> = {
  manual: "دستی / درخواست",
  bazaar: "کافه‌بازار",
  bale: "کیف پول بله",
  trial: "دورهٔ آزمایشی",
};

export function userNameOf(subscription: Pick<UserSubscription, "user">) {
  return `${subscription.user?.firstName ?? ""} ${subscription.user?.lastName ?? ""}`.trim() || "کاربر حذف‌شده";
}

/** Random, readable code (no 0/O/1/I). */
export function randomDiscountCode(prefix = "") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
  return `${prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12)}${prefix ? "-" : ""}${body}`;
}
