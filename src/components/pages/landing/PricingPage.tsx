"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { useLandingContent } from "./useLandingContent";
import { LandingPricingSection } from "./LandingPricingSection";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";

export function PricingPage({
  initialContent,
}: {
  initialContent?: ILandingContent;
}) {
  const { t } = useTranslation();
  const { content } = useLandingContent(initialContent);
  const isAuth = useAppSelector(isAuthSelector);
  const primaryCta = isAuth ? PATHS.HOME : PATHS.GET_STARTED;

  return (
    <div className="landing-page min-h-screen">
      <header className="border-b lp-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link href={PATHS.LANDING} className="flex items-center gap-2 font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-rose)] to-[var(--brand-violet)] text-sm text-white">
              پ
            </span>
            <span>{content.hero.title}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={primaryCta}>
              <Button size="sm">{isAuth ? "داشبورد" : "شروع رایگان"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <Link
          href={PATHS.LANDING}
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowRight2 size={16} />
          بازگشت به صفحه اصلی
        </Link>

        <LandingPricingSection
          pricing={content.pricing}
          primaryCta={primaryCta}
          onContactPress={() => {
            window.location.href = `${PATHS.LANDING}#contact`;
          }}
        />

        <div className="mt-14 rounded-3xl border lp-border lp-card p-8 text-center">
          <h2 className="text-xl font-bold">{t("auto.k8777c8ead8")}</h2>
          <p className="mt-2 text-sm lp-muted">
            برای دمو کسب‌وکار یا پلن سازمانی با ما در تماس باشید.
          </p>
          <Link href={`${PATHS.LANDING}#contact`} className="mt-6 inline-block">
            <Button size="lg">{t("auto.k26dbf2a80c")}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
