"use client";

import { useCallback } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { UserCurrency, UserDateCalendar } from "@/common/constants/user-preferences";

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

  return { currencyLabel, calendarLabel, calendarDescription };
}
