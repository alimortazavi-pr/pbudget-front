import { getTranslator } from "@/i18n";
const t = getTranslator();
export type UserCurrency = "toman" | "usd" | "dinar";
export type UserDateCalendar = "jalali" | "gregorian";
export type MoneyDisplayUnit = "toman" | "rial";
export type WalletBalances = Record<UserCurrency, number>;

export type UserPreferences = {
  currency: UserCurrency;
  dateCalendar: UserDateCalendar;
  moneyDisplayUnit: MoneyDisplayUnit;
  configured: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: "toman",
  dateCalendar: "jalali",
  moneyDisplayUnit: "toman",
  configured: false,
};

export const CURRENCY_OPTIONS: Array<{
  id: UserCurrency;
  label: string;
  shortLabel: string;
}> = [
  { id: "toman", get label() { return t("auto.k9e29f60874"); }, get shortLabel() { return t("auto.kee60710e11"); } },
  { id: "usd", get label() { return t("auto.k570ced5b71"); }, shortLabel: "$" },
  { id: "dinar", get label() { return t("auto.k9b7638de16"); }, get shortLabel() { return t("auto.kcc8503a041"); } },
];

export const CALENDAR_OPTIONS: Array<{
  id: UserDateCalendar;
  label: string;
  description: string;
}> = [
  {
    id: "jalali",
    get label() { return t("auto.ke7aa3ce433"); },
    get description() { return t("auto.ka409df328f"); },
  },
  {
    id: "gregorian",
    get label() { return t("auto.k4494f5a6be"); },
    get description() { return t("auto.kd921dc4506"); },
  },
];

export const MONEY_DISPLAY_UNIT_OPTIONS: Array<{
  id: MoneyDisplayUnit;
  label: string;
  description: string;
}> = [
  {
    id: "toman",
    label: "تومان",
    description: "نمایش مبالغ با واحد معمول تومان",
  },
  {
    id: "rial",
    label: "ریال",
    description: "نمایش همان مبالغ با یک صفر بیشتر؛ ۱ تومان = ۱۰ ریال",
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

export function resolveMoneyDisplayUnit(
  value?: MoneyDisplayUnit | null,
): MoneyDisplayUnit {
  return value === "rial" ? "rial" : "toman";
}

export function currencyLabel(currency: UserCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.label ?? t("auto.k9e29f60874");
}

export function currencyShortLabel(currency: UserCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.shortLabel ?? t("auto.kee60710e11");
}
