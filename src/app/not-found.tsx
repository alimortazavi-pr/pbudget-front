"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/styles";

import { PATHS } from "@/common/constants";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p aria-hidden="true" className="text-6xl font-bold text-muted">
        {t("common.notFoundCode")}
      </p>
      <h2 className="text-lg font-medium">{t("common.pageNotFound")}</h2>
      <Link className={buttonVariants()} href={PATHS.HOME}>
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
