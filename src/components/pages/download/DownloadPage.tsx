"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  Copy,
  DocumentDownload,
  Mobile,
  ShieldTick,
  TickCircle,
  Wallet3,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import { useBrandLabels } from "@/common/hooks/useBrandLabels";
import { APP_NAME_FA } from "@/common/constants/brand";
import { showToast } from "@/common/utils/toast";
import { formatLocalizedDigits } from "@/i18n/format-localized-digits";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { LanguageSelector } from "@/components/common/layout/LanguageSelector";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";

const FALLBACK_APK_URL = process.env.NEXT_PUBLIC_APK_URL ?? "/downloads/pdesk.apk";
const FALLBACK_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

const FEATURE_KEYS = ["finance", "native", "secure"] as const;
const STEP_INDICES = [0, 1, 2] as const;
const MOCK_ROW_INDICES = [0, 1, 2] as const;

export function DownloadPage() {
  const { t, language } = useTranslation();
  const { tagline } = useBrandLabels();
  const isAuth = useAppSelector(isAuthSelector);
  const appHomeHref = isAuth ? PATHS.HOME : PATHS.GET_STARTED;
  const { downloadUrl, versionName, showDownloadPromo } =
    useAndroidAppAvailability();
  const [pageUrl, setPageUrl] = useState("");

  const apkUrl = downloadUrl || FALLBACK_APK_URL;
  const appVersion = versionName || FALLBACK_VERSION;

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const copyLink = useCallback(async () => {
    const url = pageUrl || `${window.location.origin}${PATHS.DOWNLOAD}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("auto.k16d6c6a3bd"), "success");
    } catch {
      showToast(t("auto.kfc3060ba28"));
    }
  }, [pageUrl, t]);

  const descriptionKey = showDownloadPromo
    ? "download.descriptionReady"
    : "download.description";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.22),transparent),radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(168,85,247,0.12),transparent),radial-gradient(ellipse_40%_50%_at_0%_80%,rgba(14,165,233,0.1),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 top-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 bottom-24 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl"
      />

      <header className="relative z-50 flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))] lg:px-10">
        <Link href={appHomeHref}>
          <AppLogo size={44} />
        </Link>
        <div className="flex gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onPress={() => void copyLink()}>
            <Copy size={16} />
            {t("download.copyLink")}
          </Button>
          <Link href={appHomeHref}>
            <Button size="sm" variant="secondary">
              {isAuth ? t("nav.dashboard") : t("download.webLogin")}
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-20 lg:pt-10">
        <section className="order-2 lg:order-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Mobile size={14} variant="Bold" />
            {t("download.badge", { appName: APP_NAME_FA })}
          </p>
          <h1 className="mt-5 text-3xl font-black leading-tight text-foreground lg:text-5xl">
            {t("download.headline")}
            <span className="mt-2 block bg-gradient-to-l from-accent to-violet-500 bg-clip-text text-transparent">
              {t("download.headlineAccent")}
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted lg:text-lg">
            {t(descriptionKey, { tagline })}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {showDownloadPromo ? (
              <a href={apkUrl} download="pdesk.apk" className="inline-flex">
                <Button
                  size="lg"
                  className="min-h-14 bg-accent px-8 text-base font-bold text-accent-foreground shadow-lg shadow-accent/25"
                >
                  <DocumentDownload size={22} />
                  {t("download.downloadApk")}
                </Button>
              </a>
            ) : (
              <Button
                isDisabled
                size="lg"
                className="min-h-14 bg-accent px-8 text-base font-bold text-accent-foreground shadow-lg shadow-accent/25"
              >
                <DocumentDownload size={22} />
                {t("download.comingSoon")}
              </Button>
            )}
            <p className="text-center text-xs text-muted sm:text-start">
              {t("download.versionInfo", {
                version: formatLocalizedDigits(appVersion, language),
              })}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {FEATURE_KEYS.map((key) => {
              const Icon =
                key === "finance" ? Wallet3 : key === "native" ? Mobile : ShieldTick;
              return (
                <article
                  key={key}
                  className="glass rounded-2xl border border-border/40 p-4 transition hover:border-accent/30"
                >
                  <span className="inline-flex rounded-xl bg-accent/15 p-2 text-accent">
                    <Icon size={20} variant="Bold" />
                  </span>
                  <p className="mt-3 font-bold">{t(`download.features.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-6 text-muted">
                    {t(`download.features.${key}.desc`)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="order-1 flex justify-center lg:order-2">
          <div className="relative w-full max-w-[320px]">
            <div
              aria-hidden
              className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-br from-accent/30 via-violet-500/20 to-sky-400/20 blur-2xl"
            />
            <div className="relative rounded-[2.5rem] border border-white/40 bg-gradient-to-b from-white/80 to-white/50 p-3 shadow-2xl shadow-accent/10 backdrop-blur-xl dark:from-surface/90 dark:to-surface-secondary/80">
              <div className="overflow-hidden rounded-[2rem] border border-border/30 bg-surface">
                <div className="flex items-center justify-between bg-accent px-4 py-3 text-accent-foreground">
                  <p className="text-sm font-bold">{APP_NAME_FA}</p>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                    Android
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-2xl bg-surface-secondary/80 p-3">
                    <p className="text-xs text-muted">{t("auto.k4497cf2376")}</p>
                    <p className="mt-1 text-xl font-bold text-income" dir="ltr">
                      +۲۴,۵۰۰,۰۰۰
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-expense/10 p-2.5 text-center">
                      <p className="text-[10px] text-muted">{t("common.expense")}</p>
                      <p className="text-sm font-bold text-expense">{t("auto.k295aa1774f")}</p>
                    </div>
                    <div className="rounded-xl bg-income/10 p-2.5 text-center">
                      <p className="text-[10px] text-muted">{t("common.income")}</p>
                      <p className="text-sm font-bold text-income">{t("auto.k6a6156b0d7")}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {MOCK_ROW_INDICES.map((index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 text-xs"
                      >
                        <span>{t(`download.mockRows.${index}`)}</span>
                        <span className="h-2 w-2 rounded-full bg-accent" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-10">
        <div className="glass rounded-3xl border border-border/50 p-6 lg:p-8">
          <h2 className="text-lg font-bold">{t("download.installTitle")}</h2>
          <ol className="mt-4 space-y-3">
            {STEP_INDICES.map((index) => (
              <li key={index} className="flex items-start gap-3 text-sm leading-7">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {formatLocalizedDigits(index + 1, language)}
                </span>
                <span className="text-muted">{t(`download.steps.${index}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted">
            <TickCircle size={16} className="text-income" variant="Bold" />
            <span>
              {t("download.pageLinkLabel")}{" "}
              <span className="font-mono text-foreground" dir="ltr">
                pdesk.ir/download
              </span>
            </span>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-8">
        <SiteFooterCredits />
      </footer>
    </div>
  );
}
