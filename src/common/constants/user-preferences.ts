import { getTranslator } from "@/i18n";
const t = getTranslator();
export type UserCurrency = "toman" | "usd" | "dinar";
export type UserDateCalendar = "jalali" | "gregorian";
export type WalletBalances = Record<UserCurrency, number>;

export type UserPreferences = {
  currency: UserCurrency;
  dateCalendar: UserDateCalendar;
  configured: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: "toman",
  dateCalendar: "jalali",
  configured: false,
};

export const CURRENCY_OPTIONS: Array<{
  id: UserCurrency;
  label: string;
  shortLabel: string;
}> = [
  { id: "toman", label: t("auto.k9e29f60874"), shortLabel: t("auto.kee60710e11") },
  { id: "usd", label: t("auto.k570ced5b71"), shortLabel: "$" },
  { id: "dinar", label: t("auto.k9b7638de16"), shortLabel: t("auto.kcc8503a041") },
];

export const CALENDAR_OPTIONS: Array<{
  id: UserDateCalendar;
  label: string;
  description: string;
}> = [
  {
    id: "jalali",
    label: t("auto.ke7aa3ce433"),
    description: t("auto.ka409df328f"),
  },
  {
    id: "gregorian",
    label: t("auto.k4494f5a6be"),
    description: t("auto.kd921dc4506"),
  },
];

export function resolveBudgetCurrency(
  value?: UserCurrency | null,
): UserCurrency {
  if (value === "usd" || value === "dinar" || value === "toman") return value;
  return "toman";
}

export function resolveBudgetDateCalendar(
  value?: UserDateCalendar | null,
): UserDateCalendar {
  if (value === "gregorian" || value === "jalali") return value;
  return "jalali";
}

export function currencyLabel(currency: UserCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.label ?? t("auto.k9e29f60874");
}

export function currencyShortLabel(currency: UserCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.shortLabel ?? t("auto.kee60710e11");
}
