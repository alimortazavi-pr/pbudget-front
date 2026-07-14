"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PATHS } from "@/common/constants";
import { isPathAllowedInSimpleMode } from "@/common/utils/app-mode-paths";
import { showToast } from "@/common/utils/toast";
import { useAppMode } from "@/components/providers/AppModeProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";

type SimpleModeGuardProps = {
  children: ReactNode;
};

export function SimpleModeGuard({ children }: SimpleModeGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSimple, mounted } = useAppMode();
  const { t } = useTranslation();

  useEffect(() => {
    if (!mounted || !isSimple) return;
    if (isPathAllowedInSimpleMode(pathname)) return;

    showToast(t("common.simpleModeRedirect"), "warning");
    router.replace(PATHS.HOME);
  }, [mounted, isSimple, pathname, router, t]);

  if (!mounted) return children;
  if (isSimple && !isPathAllowedInSimpleMode(pathname)) {
    return (
      <div className="pb-shimmer mx-auto mt-8 h-40 max-w-lg rounded-2xl" />
    );
  }

  return children;
}
