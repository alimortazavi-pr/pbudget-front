"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import * as adminApi from "@/common/api/admin";
import { PATHS } from "@/common/constants";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { DEFAULT_LANDING_CONTENT } from "@/components/pages/landing/landing-data";
import { LandingPage } from "@/components/pages/landing/LandingPage";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";

export function LandingPreviewPage() {  const { t } = useTranslation();

  const router = useRouter();
  const isAuth = useAppSelector(isAuthSelector);
  const user = useAppSelector(userSelector);
  const [content, setContent] = useState<ILandingContent | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuth) {
      router.replace(PATHS.GET_STARTED);
      return;
    }
    if (!user?.isAdmin) {
      router.replace(PATHS.HOME);
      return;
    }

    void adminApi
      .fetchAdminLandingPreview()
      .then(setContent)
      .catch(() => {
        setError(true);
        setContent(DEFAULT_LANDING_CONTENT);
      });
  }, [isAuth, user?.isAdmin, router]);

  if (!content) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        {t("auto.k73808a4054")}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[200] border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:text-amber-100">
        {t("auto.k5c65cae79b")}
        {error ? t("auto.ka92cd68892") : null}
      </div>
      <div className="pt-10">
        <LandingPage initialContent={content} />
      </div>
    </>
  );
}
