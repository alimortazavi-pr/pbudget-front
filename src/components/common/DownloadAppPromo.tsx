"use client";

import Link from "next/link";
import { DocumentDownload, Mobile } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import { useTranslation } from "@/components/providers/LanguageProvider";

type DownloadAppPromoProps = {
  className?: string;
};

export function DownloadAppPromo({ className = "" }: DownloadAppPromoProps) {
  const { t } = useTranslation();
  const { apkAvailable, loading, versionName } = useAndroidAppAvailability();

  return (
    <Link
      href={PATHS.DOWNLOAD}
      className={`group flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4 transition-colors hover:border-accent/40 hover:bg-accent/12 ${className}`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent/20">
        <Mobile size={22} variant="Bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{t("nav.downloadApp")}</p>
        <p className="mt-0.5 text-xs text-muted">
          {loading
            ? t("common.loading")
            : apkAvailable
              ? t("nav.downloadAppReady", { version: versionName ?? "" })
              : t("nav.downloadAppSoon")}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
        <DocumentDownload size={16} />
        {apkAvailable ? t("common.download") : t("nav.more")}
      </span>
    </Link>
  );
}
