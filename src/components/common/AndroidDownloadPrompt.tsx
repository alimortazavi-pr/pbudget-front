"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { CloseCircle, DocumentDownload } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { useTranslation } from "@/i18n";

const SEEN_PREFIX = "pdesk-android-promo-seen-v";
const SHOW_DELAY_MS = 2500;

/** Pages where the promo would be noise: auth, the download page itself, legal and admin. */
function isPromoPath(pathname: string) {
  if (pathname === PATHS.LANDING || pathname === PATHS.HOME) return true;
  const blocked = [
    PATHS.GET_STARTED,
    PATHS.WORKSPACE,
    PATHS.DOWNLOAD,
    PATHS.PRIVACY,
    "/admin",
    "/partner-invite",
    "/landing-preview",
  ];
  return !blocked.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * One-time "the Android app is out" card for people browsing the site on an Android phone.
 * It stays dismissed until a newer app version is published, and never shows inside the app itself.
 */
export function AndroidDownloadPrompt() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const { apkAvailable, downloadUrl, versionCode, byteSize } = useAndroidAppAvailability();
  const [visible, setVisible] = useState(false);

  const seenKey = `${SEEN_PREFIX}${versionCode ?? 0}`;

  useEffect(() => {
    if (!apkAvailable || !isPromoPath(pathname)) {
      setVisible(false);
      return;
    }
    if (typeof window === "undefined") return;
    // Already inside an installed app (old Capacitor shell, native WebView or standalone PWA).
    const inApp =
      Boolean((window as unknown as { Capacitor?: unknown }).Capacitor) ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (inApp || !/Android/i.test(navigator.userAgent)) return;
    try {
      if (localStorage.getItem(seenKey) === "1") return;
    } catch {
      /* private mode: show once per page load */
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [apkAvailable, pathname, seenKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, [seenKey]);

  if (!visible || !downloadUrl) return null;

  const sizeMb = byteSize ? Math.max(1, Math.round(byteSize / (1024 * 1024))) : null;

  return (
    <div
      role="dialog"
      aria-label={t("download.promoTitle", { appName: APP_NAME_FA })}
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[65] mx-auto max-w-lg"
    >
      <div className="glass flex items-start gap-3 rounded-2xl border border-accent/30 p-4 shadow-xl">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <Image src="/assets/logo-mark.png" alt="" width={48} height={48} className="size-12" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-bold text-foreground">{t("download.promoTitle", { appName: APP_NAME_FA })}</p>
            <p className="mt-1 text-sm leading-7 text-muted">{t("download.promoBody")}</p>
            {sizeMb ? (
              <p className="mt-1 text-xs text-muted">
                {toPersianDigits(t("download.promoSize", { size: String(sizeMb) }))}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={downloadUrl}
              download="pdesk.apk"
              onClick={dismiss}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-md shadow-accent/25"
            >
              <DocumentDownload size={18} />
              {t("download.promoCta")}
            </a>
            <Link
              href={PATHS.DOWNLOAD}
              onClick={dismiss}
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-accent"
            >
              {t("download.promoGuide")}
            </Link>
            <Button size="sm" variant="ghost" onPress={dismiss}>
              {t("download.promoLater")}
            </Button>
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
    </div>
  );
}
