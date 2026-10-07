"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Crown, Lock1, Refresh2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { SUBSCRIPTION_FEATURE_CATALOG, type SubscriptionFeatureKey } from "@/common/constants/subscription-features";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { FeaturePreview } from "@/components/common/subscription/FeaturePreview";
import { StartTrialButton } from "@/components/common/subscription/TrialPromo";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

/**
 * Shows the page only when the user's plan includes `feature`; otherwise an
 * upgrade screen instead of a page full of "403" errors.
 */
export function FeatureGate({ feature, children }: { feature: SubscriptionFeatureKey; children: ReactNode }) {
  const { t } = useTranslation();
  const { loading, data, error, refresh, isFeatureEnabled } = useSubscriptionAccess();

  if (loading && !data) {
    return <div className="pb-shimmer h-48 w-full rounded-2xl" aria-hidden />;
  }
  if (isFeatureEnabled(feature)) return <>{children}</>;

  // We could not reach the server: say so instead of claiming the plan lacks the feature.
  if (error && !data) {
    return (
      <section className="mx-auto flex min-h-[420px] w-full max-w-2xl items-center justify-center rounded-3xl border border-border/60 bg-surface p-8 text-center shadow-sm">
        <div className="max-w-md">
          <h1 className="text-xl font-bold">{t("common.subscription.checkFailedTitle")}</h1>
          <p className="mt-3 text-sm leading-7 text-muted">{t("common.subscription.checkFailedBody")}</p>
          <Button className="mt-6" onPress={() => void refresh()}>
            <Refresh2 size={18} />
            {t("common.subscription.retry")}
          </Button>
        </div>
      </section>
    );
  }

  const catalog = SUBSCRIPTION_FEATURE_CATALOG.find((item) => item.key === feature);
  const label = catalog ? t(catalog.labelKey) : feature;
  // The trial covers everything except the AI assistant.
  const canTrial = Boolean(data?.trial?.eligible) && feature !== "ai";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section className="rounded-3xl border border-accent/20 bg-surface p-6 text-center shadow-sm sm:p-8">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
          <Lock1 size={30} variant="Bold" />
          <span className="absolute -end-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-warning text-warning-foreground shadow">
            <Crown size={15} variant="Bold" />
          </span>
        </div>
        <h1 className="mt-5 text-xl font-bold">{t("common.subscription.featureLockedTitle", { feature: label })}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{t("common.subscription.featureLockedBody")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {canTrial ? <StartTrialButton /> : null}
          <Link
            href={PATHS.PLANS}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:opacity-90 ${
              canTrial ? "border border-border bg-surface-secondary" : "bg-accent text-accent-foreground shadow-md"
            }`}
          >
            <Crown size={18} variant="Bold" />
            {t("common.subscription.compareAndUpgrade")}
          </Link>
        </div>
        {canTrial ? <p className="mt-3 text-xs text-muted">{t("common.trial.cardBody")}</p> : null}
      </section>

      <section aria-label={t("common.trial.previewTitle")} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{t("common.trial.previewTitle")}</h2>
          <span className="rounded-full bg-warning/20 px-3 py-1 text-[11px] font-semibold text-warning-foreground">{t("common.trial.previewBadge")}</span>
        </div>
        <FeaturePreview feature={feature} />
        <p className="text-center text-xs text-muted">{t("common.trial.previewHint")}</p>
      </section>
    </div>
  );
}
