"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Crown, Lock1 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { SUBSCRIPTION_FEATURE_CATALOG, type SubscriptionFeatureKey } from "@/common/constants/subscription-features";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

/**
 * Shows the page only when the user's plan includes `feature`; otherwise an
 * upgrade screen instead of a page full of "403" errors.
 */
export function FeatureGate({ feature, children }: { feature: SubscriptionFeatureKey; children: ReactNode }) {
  const { t } = useTranslation();
  const { loading, data, isFeatureEnabled } = useSubscriptionAccess();

  if (loading && !data) {
    return <div className="pb-shimmer h-48 w-full rounded-2xl" aria-hidden />;
  }
  if (isFeatureEnabled(feature)) return <>{children}</>;

  const catalog = SUBSCRIPTION_FEATURE_CATALOG.find((item) => item.key === feature);
  const label = catalog ? t(catalog.labelKey) : feature;

  return (
    <section className="mx-auto flex min-h-[420px] w-full max-w-2xl items-center justify-center rounded-3xl border border-accent/20 bg-surface p-8 text-center shadow-sm">
      <div className="max-w-md">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
          <Lock1 size={30} variant="Bold" />
          <span className="absolute -end-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-warning text-warning-foreground shadow">
            <Crown size={15} variant="Bold" />
          </span>
        </div>
        <h1 className="mt-5 text-xl font-bold">{t("common.subscription.featureLockedTitle", { feature: label })}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{t("common.subscription.featureLockedBody")}</p>
        <Link
          href={PATHS.PLANS}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-md transition hover:opacity-90"
        >
          <Crown size={18} variant="Bold" />
          {t("common.subscription.compareAndUpgrade")}
        </Link>
      </div>
    </section>
  );
}
