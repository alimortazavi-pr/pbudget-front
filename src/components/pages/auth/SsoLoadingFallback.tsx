"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

export function SsoLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-muted">
      {t("common.loading")}
    </div>
  );
}
