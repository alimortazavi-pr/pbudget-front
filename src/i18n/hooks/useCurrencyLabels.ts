"use client";

import { useCallback } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { UserCurrency, UserDateCalendar } from "@/common/constants/user-preferences";
import { moneyDisplayUnitLabel } from "@/common/utils/money-display";

export function useCurrencyLabels() {
  const { t } = useTranslation();

  const currencyLabel = useCallback(
    (currency: UserCurrency) => {
      if (currency === "usd") return t("common.dollar");
      if (currency === "dinar") return t("common.dinar");
      return t("common.toman");
    },
    [t],
  );

  const displayCurrencyLabel = useCallback(
    (currency: UserCurrency) =>
      currency === "toman" ? moneyDisplayUnitLabel() : currencyLabel(currency),
    [currencyLabel],
  );

  const calendarLabel = useCallback(
    (calendar: UserDateCalendar) => {
      return calendar === "gregorian"
        ? t("common.gregorianCalendar")
        : t("common.jalaliCalendar");
    },
    [t],
  );

  const calendarDescription = useCallback(
    (calendar: UserDateCalendar) => {
      return calendar === "gregorian"
        ? t("common.gregorianCalendarDesc")
        : t("common.jalaliCalendarDesc");
    },
    [t],
  );

  return { currencyLabel, displayCurrencyLabel, calendarLabel, calendarDescription };
}
