export type UserCurrency = "toman" | "usd" | "dinar";
export type UserDateCalendar = "jalali" | "gregorian";

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
  { id: "toman", label: "تومان", shortLabel: "ت" },
  { id: "usd", label: "دلار", shortLabel: "$" },
  { id: "dinar", label: "دینار", shortLabel: "د." },
];

export const CALENDAR_OPTIONS: Array<{
  id: UserDateCalendar;
  label: string;
  description: string;
}> = [
  {
    id: "jalali",
    label: "شمسی (جلالی)",
    description: "تقویم ایرانی — فروردین تا اسفند",
  },
  {
    id: "gregorian",
    label: "میلادی",
    description: "تقویم میلادی — January تا December",
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
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.label ?? "تومان";
}

export function currencyShortLabel(currency: UserCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.id === currency)?.shortLabel ?? "ت";
}
