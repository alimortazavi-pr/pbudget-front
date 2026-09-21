"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { useLandingContent } from "./useLandingContent";
import { LandingPricingSection } from "./LandingPricingSection";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import * as subscriptionApi from "@/common/api/subscriptions";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { useEffect, useState } from "react";

export function PricingPage({
  initialContent,
}: {
  initialContent?: ILandingContent;
}) {
  const { t } = useTranslation();
  const { content } = useLandingContent(initialContent);
  const isAuth = useAppSelector(isAuthSelector);
  const primaryCta = isAuth ? PATHS.HOME : PATHS.GET_STARTED;
  const [livePlans, setLivePlans] = useState<SubscriptionPlan[] | null>(null);

  useEffect(() => {
    void subscriptionApi.fetchPublicSubscriptionPlans().then(setLivePlans).catch(() => setLivePlans(null));
  }, []);

  const pricing = livePlans && livePlans.length > 0
    ? {
        ...content.pricing,
        plans: livePlans.map((plan) => ({
          id: `subscription-${plan.slug}`,
          name: plan.name,
          price: `${plan.price.toLocaleString("fa-IR")} ${plan.priceUnit}`,
          period: plan.period === "lifetime" ? "یک‌بار" : plan.period === "yearly" ? "سالانه" : plan.period === "monthly" ? "ماهانه" : `${plan.periodDays ?? ""} روزه`,
          description: plan.description,
          features: plan.features.filter((feature) => feature.enabled).map((feature) => feature.limit ? `${feature.label} (${feature.limit})` : feature.label),
          cta: "تماس با ادمین",
          highlighted: plan.highlighted,
        })),
      }
    : content.pricing;

  return (
    <div className="landing-page min-h-screen">
      <header className="border-b lp-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link href={PATHS.LANDING} className="flex items-center gap-2 font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-rose)] to-[var(--brand-violet)] text-sm text-white">
              {t("brand.logoMark")}
            </span>
            <span>{content.hero.title}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={primaryCta} className={buttonVariants({ size: "sm" })}>
              {isAuth ? t("nav.dashboard") : t("auto.k4bbf9a5a8b")}
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
          {t("auto.k1bd7e08e16")}
        </Link>

        <LandingPricingSection
          pricing={pricing}
          primaryCta={primaryCta}
          headingLevel="h1"
          onContactPress={() => {
            window.location.href = `${PATHS.LANDING}#contact`;
          }}
        />

        <div className="mt-14 rounded-3xl border lp-border lp-card p-8 text-center">
          <h2 className="text-xl font-bold">{t("auto.k8777c8ead8")}</h2>
          <p className="mt-2 text-sm lp-muted">
            {t("auto.k2f8db09e58")}
          </p>
          <Link
            href={`${PATHS.LANDING}#contact`}
            className={buttonVariants({ size: "lg", className: "mt-6" })}
          >
            {t("auto.k26dbf2a80c")}
          </Link>
        </div>
      </main>
    </div>
  );
}
