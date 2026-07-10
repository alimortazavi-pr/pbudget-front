"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

export function useBrandLabels() {
  const { t } = useTranslation();
  return {
    appName: t("brand.appName"),
    appNameEn: t("brand.appNameEn"),
    tagline: t("brand.tagline"),
    description: t("brand.description"),
  };
}
