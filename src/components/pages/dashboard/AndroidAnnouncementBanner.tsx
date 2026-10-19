"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CloseCircle } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { useTranslation } from "@/i18n";

const SEEN_PREFIX = "pdesk-android-banner-seen-v";
/** First versionCode of the native app; older APKs on the server are not "the Android app". */
const MIN_NATIVE_VERSION_CODE = 20;

/**
 * Dismissible card in the panel telling signed-in users the Android app is out.
 * Stays gone until a newer app version is published, and never shows inside an installed app.
 */
export function AndroidAnnouncementBanner() {
  const { t } = useTranslation();
  const { apkAvailable, downloadUrl, versionCode, versionName } = useAndroidAppAvailability();
  const [visible, setVisible] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const seenKey = `${SEEN_PREFIX}${versionCode ?? 0}`;

  useEffect(() => {
    if (!apkAvailable || (versionCode ?? 0) < MIN_NATIVE_VERSION_CODE) return;
    const inApp =
      Boolean((window as unknown as { Capacitor?: unknown }).Capacitor) ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (inApp) return;
    setIsAndroid(/Android/i.test(navigator.userAgent));
    try {
      if (localStorage.getItem(seenKey) === "1") return;
    } catch {
      /* private mode: show once per page load */
    }
    setVisible(true);
  }, [apkAvailable, seenKey, versionCode]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, [seenKey]);

  if (!visible) return null;

  const ctaClass =
    "inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-md shadow-accent/25";

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="font-bold text-foreground">{t("download.bannerTitle")}</p>
          <p className="mt-1 text-sm leading-7 text-muted">{t("download.bannerBody")}</p>
          {versionName ? (
            <p className="mt-1 text-xs text-muted">{toPersianDigits(`v${versionName}`)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAndroid && downloadUrl ? (
            <a href={downloadUrl} download="pdesk.apk" onClick={dismiss} className={ctaClass}>
              {t("download.bannerCta")}
            </a>
          ) : (
            <Link href={PATHS.DOWNLOAD} onClick={dismiss} className={ctaClass}>
              {t("download.bannerCta")}
            </Link>
          )}
          <Link href={PATHS.DOWNLOAD} className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-accent">
            {t("download.bannerDetails")}
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label={t("common.close")}
        className="shrink-0 text-muted transition hover:text-foreground"
        onClick={dismiss}
      >
        <CloseCircle size={20} />
      </button>
    </div>
  );
}
