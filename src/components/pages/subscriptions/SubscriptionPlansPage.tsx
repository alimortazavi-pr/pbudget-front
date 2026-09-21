"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft2, Crown, Lock1, TickCircle } from "iconsax-reactjs";
import { Button } from "@heroui/react";

import * as subscriptionApi from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import type { MySubscriptionResponse, SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mine, setMine] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([subscriptionApi.fetchPublicSubscriptionPlans(), subscriptionApi.fetchMySubscription()])
      .then(([nextPlans, nextMine]) => { if (!cancelled) { setPlans(nextPlans); setMine(nextMine); } })
      .catch(() => { if (!cancelled) showToast(t("common.subscription.loadError"), "danger"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const featureCatalog = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    plans.forEach((plan) => plan.features.forEach((feature) => {
      if (!map.has(feature.key)) map.set(feature.key, { key: feature.key, label: feature.label });
    }));
    return [...map.values()];
  }, [plans]);

  const currentPlanId = mine?.subscription?.plan?._id;
  const userHasPlan = Boolean(mine?.subscription);

  function isAvailableForUser(key: string) {
    return userHasPlan && Boolean(mine?.entitlements[key]?.enabled);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Crown size={24} variant="Bold" /></div><div><h1 className="text-2xl font-bold tracking-tight">{t("common.subscription.plansTitle")}</h1><p className="mt-1 max-w-2xl text-sm text-muted">{t("common.subscription.plansDescription")}</p></div></div><Link href={PATHS.HOME} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"><ArrowLeft2 size={16} />{t("common.subscription.backToDashboard")}</Link></header>

      {mine?.subscription ? <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border-accent/30 p-4"><div><p className="text-xs text-muted">{t("common.subscription.currentPlan")}</p><p className="mt-1 font-bold">{mine.subscription.plan?.name ?? mine.subscription.planSnapshot?.name}</p></div><span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success-foreground">{t("common.subscription.active")}</span></div> : <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-4 text-sm text-muted">{t("common.subscription.noActivePlanHint")}</div>}

      {loading ? <div className="grid gap-5 lg:grid-cols-2"><div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" /><div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" /></div> : plans.length === 0 ? <div className="glass rounded-3xl p-10 text-center text-muted">{t("common.subscription.noPlans")}</div> : <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{plans.map((plan) => {
        const isCurrent = plan._id === currentPlanId;
        return <article key={plan._id} className={`relative flex flex-col rounded-3xl border p-5 ${isCurrent ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" : "glass border-border/70"}`}>
          {isCurrent ? <span className="absolute -top-3 end-5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{t("common.subscription.currentPlanBadge")}</span> : null}
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-1 text-sm text-muted">{plan.description}</p></div>{plan.highlighted ? <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs text-warning-foreground">{t("common.subscription.recommended")}</span> : null}</div>
          <p className="mt-5 text-3xl font-extrabold" dir="rtl">{formatPrice(plan.price)} <span className="text-sm font-medium text-muted">{plan.priceUnit} / {plan.period === "monthly" ? t("common.subscription.monthly") : plan.period === "yearly" ? t("common.subscription.yearly") : plan.period === "lifetime" ? t("common.subscription.lifetime") : t("common.subscription.custom")}</span></p>
          <div className="my-5 h-px bg-border/70" />
          <div className="flex-1 space-y-2">{featureCatalog.map((catalogFeature) => {
            const planFeature = plan.features.find((feature) => feature.key === catalogFeature.key);
            const enabledInPlan = Boolean(planFeature?.enabled);
            const enabledForUser = enabledInPlan && isAvailableForUser(catalogFeature.key);
            const lockedBecauseOfUserPlan = enabledInPlan && !enabledForUser;
            return <div key={catalogFeature.key} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${enabledForUser ? "bg-success/8 text-foreground" : "bg-surface-secondary/60 text-muted"}`}><span className="mt-0.5 shrink-0">{enabledForUser ? <TickCircle size={18} className="text-success" /> : <Lock1 size={17} className="text-muted" />}</span><div className="min-w-0"><p className={enabledForUser ? "font-medium" : "font-medium text-muted"}>{catalogFeature.label}{planFeature?.limit != null ? <span className="ms-1 text-xs text-muted">({planFeature.limit})</span> : null}</p><p className="mt-0.5 text-xs text-muted">{!enabledInPlan ? t("common.subscription.notIncludedInPlan") : lockedBecauseOfUserPlan ? t("common.subscription.notForYourPlan") : t("common.subscription.enabledForYou")}</p></div></div>;
          })}</div>
          <Button className="mt-6 w-full" variant={isCurrent ? "secondary" : "primary"} onPress={() => { window.location.href = `${PATHS.LANDING}#contact`; }}>{isCurrent ? t("common.subscription.currentPlan") : t("common.subscription.contactAdmin")}</Button>
        </article>;
      })}</div>}
    </div>
  );
}
