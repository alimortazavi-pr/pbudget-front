"use client";

import { useCallback } from "react";

import { useTranslation } from "@/i18n";

/** "امروز" / "دیروز" / "۲ روز پیش" / "۳ هفته پیش" / "۲ ماه پیش" for an ISO date. */
export function useRelativeDays() {
  const { t } = useTranslation();
  return useCallback(
    (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const days = Math.max(0, Math.floor(diff / 86_400_000));
      if (days === 0) return t("feat.assets.ago.today");
      if (days === 1) return t("feat.assets.ago.yesterday");
      if (days < 7) return t("feat.assets.ago.days", { n: days });
      if (days < 30) return t("feat.assets.ago.weeks", { n: Math.floor(days / 7) });
      if (days < 365) return t("feat.assets.ago.months", { n: Math.floor(days / 30) });
      return t("feat.assets.ago.years", { n: Math.floor(days / 365) });
    },
    [t],
  );
}
