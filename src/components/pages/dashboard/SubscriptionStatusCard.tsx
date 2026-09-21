"use client";

import Link from "next/link";
import { ArrowLeft2, Crown, TickCircle } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { formatPrice } from "@/common/utils";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

export function SubscriptionStatusCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { data, loading } = useSubscriptionAccess();

  if (loading) {
    return <div className={`${compact ? "pb-hmi-surface" : "glass"} h-24 animate-pulse rounded-2xl bg-surface-secondary`} aria-hidden="true" />;
  }

  const subscription = data?.subscription;
  const plan = subscription?.plan ?? subscription?.planSnapshot;
  const enabledCount = Object.values(data?.entitlements ?? {}).filter((item) => item.enabled).length;

  return (
    <section className={`${compact ? "pb-hmi-surface" : "glass"} rounded-2xl p-4`} aria-label={t("common.subscription.currentPlan")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent"><Crown size={20} variant="Bold" /></div>
          <div className="min-w-0"><p className="text-xs text-muted">{t("common.subscription.currentPlan")}</p><h3 className="mt-1 truncate text-base font-bold">{plan?.name ?? t("common.subscription.noActivePlan")}</h3>{plan && <p className="mt-1 text-xs text-muted">{formatPrice(plan.price)} {plan.priceUnit}{subscription?.expiresAt ? ` · ${t("common.subscription.expiresOn", { date: new Date(subscription.expiresAt).toLocaleDateString("fa-IR") })}` : ""}</p>}</div>
        </div>
        <Link href={PATHS.PLANS} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline">{t("common.subscription.viewPlans")}<ArrowLeft2 size={15} /></Link>
      </div>
      {subscription ? <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success-foreground">{t("common.subscription.active")}</span><span className="text-xs text-muted">{t("common.subscription.enabledFeatures", { count: String(enabledCount) })}</span></div> : <p className="mt-3 rounded-xl bg-surface-secondary px-3 py-2 text-sm text-muted">{t("common.subscription.contactAdminToActivate")}</p>}
      {subscription && enabledCount > 0 ? <div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(data?.entitlements ?? {}).filter(([, item]) => item.enabled).slice(0, 4).map(([key, item]) => <span key={key} className="inline-flex items-center gap-1 rounded-full bg-accent/8 px-2 py-1 text-[11px] text-accent"><TickCircle size={13} />{item.label}</span>)}</div> : null}
    </section>
  );
}
