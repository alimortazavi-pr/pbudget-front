"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted">{t("common.notFoundCode")}</p>
      <p className="text-lg font-medium">{t("common.pageNotFound")}</p>
      <Link href={PATHS.HOME}>
        <Button>{t("common.backToHome")}</Button>
      </Link>
    </div>
  );
}
