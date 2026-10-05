"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, TextArea } from "@heroui/react";
import { Clock, Crown, Lock1, TickCircle, Timer1 } from "iconsax-reactjs";
import { createPortal } from "react-dom";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

function usePeriodLabel() {
  const { t } = useTranslation();
  return (plan: SubscriptionPlan) =>
    plan.period === "monthly"
      ? t("common.subscription.monthly")
      : plan.period === "yearly"
        ? t("common.subscription.yearly")
        : plan.period === "lifetime"
          ? t("common.subscription.lifetime")
          : `${toPersianDigits(plan.periodDays ?? 0)} ${t("common.subscription.custom")}`;
}

export function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const periodLabel = usePeriodLabel();
  const { data: mine, refresh } = useSubscriptionAccess();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<SubscriptionPlan | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void subscriptionApi
      .fetchPublicSubscriptionPlans()
      .then((next) => !cancelled && setPlans(next))
      .catch(() => !cancelled && showToast(t("common.subscription.loadError"), "danger"))
      .finally(() => !cancelled && setLoading(false));
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refresh, t]);

  const featureCatalog = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    plans.forEach((plan) =>
      plan.features.forEach((feature) => {
        if (!map.has(feature.key)) map.set(feature.key, { key: feature.key, label: feature.label });
      }),
    );
    return [...map.values()];
  }, [plans]);

  const current = mine?.subscription ?? null;
  const currentSlug = current?.plan?.slug ?? current?.planSnapshot?.slug;
  const pending = mine?.pendingRequest ?? null;
  const pendingPlanId = typeof pending?.plan === "object" ? pending?.plan?._id : (pending?.plan as unknown as string | undefined);
  const days = mine?.daysRemaining;

  async function cancelRequest() {
    setCanceling(true);
    try {
      await subscriptionApi.cancelSubscriptionRequest();
      showToast(t("common.subscription.requestCanceled"), "success");
      await refresh();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Crown size={24} variant="Bold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("common.subscription.plansTitle")}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{t("common.subscription.plansDescription")}</p>
        </div>
      </header>

      {current ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success-foreground">
              <TickCircle size={20} variant="Bold" />
            </span>
            <div>
              <p className="text-xs text-muted">{t("common.subscription.currentPlan")}</p>
              <p className="font-bold">{current.plan?.name ?? current.planSnapshot?.name}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              days != null && days <= 7 ? "bg-warning/20 text-warning-foreground" : "bg-surface-secondary text-muted"
            }`}
          >
            <Timer1 size={14} />
            {days == null
              ? t("common.subscription.neverExpires")
              : days <= 7
                ? t("common.subscription.expiresSoon", { days })
                : t("common.subscription.daysLeft", { days })}
          </span>
        </div>
      ) : null}

      {pending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Clock size={22} className="mt-0.5 shrink-0 text-warning-foreground" variant="Bold" />
            <div>
              <p className="font-semibold">
                {t("common.subscription.pendingRequest", { plan: pending.plan?.name ?? pending.planSnapshot?.name ?? "" })}
              </p>
              <p className="mt-0.5 text-xs text-muted">{t("common.subscription.pendingRequestHint")}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" isPending={canceling} onPress={() => void cancelRequest()}>
            {t("common.subscription.cancelRequest")}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" />
          <div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-surface p-10 text-center text-muted">{t("common.subscription.noPlans")}</div>
      ) : (
        <div className={`grid gap-5 ${plans.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentSlug;
            const isRequested = pendingPlanId === plan._id;
            const isFree = plan.price === 0;
            return (
              <article
                key={plan._id}
                className={`relative flex flex-col rounded-3xl border p-6 transition ${
                  plan.highlighted && !isCurrent
                    ? "border-accent/50 bg-gradient-to-b from-accent/8 to-surface shadow-xl shadow-accent/10"
                    : isCurrent
                      ? "border-success/50 bg-surface"
                      : "border-border/60 bg-surface"
                }`}
              >
                {isCurrent ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
                    {t("common.subscription.currentPlanBadge")}
                  </span>
                ) : plan.highlighted ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                    {t("common.subscription.recommended")}
                  </span>
                ) : null}

                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-1 min-h-10 text-sm leading-6 text-muted">{plan.description}</p>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">{isFree ? t("common.subscription.free") : formatPrice(plan.price)}</span>
                  {!isFree ? (
                    <span className="text-sm text-muted">
                      {plan.priceUnit} / {periodLabel(plan)}
                    </span>
                  ) : null}
                </p>

                <ul className="my-6 flex-1 space-y-2.5 border-t border-border/60 pt-5">
                  {featureCatalog.map((catalogFeature) => {
                    const feature = plan.features.find((item) => item.key === catalogFeature.key);
                    const enabled = Boolean(feature?.enabled);
                    return (
                      <li key={catalogFeature.key} className={`flex items-center gap-2.5 text-sm ${enabled ? "" : "text-muted"}`}>
                        {enabled ? (
                          <TickCircle size={18} className="shrink-0 text-success" variant="Bold" />
                        ) : (
                          <Lock1 size={16} className="shrink-0 text-muted/70" />
                        )}
                        <span className={enabled ? "" : "line-through decoration-muted/40"}>{catalogFeature.label}</span>
                        {feature?.limit != null && enabled ? (
                          <span className="text-xs text-muted">({toPersianDigits(feature.limit)})</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {isCurrent ? (
                  <Button variant="secondary" isDisabled className="w-full">
                    {t("common.subscription.currentPlanCta")}
                  </Button>
                ) : isFree ? null : isRequested ? (
                  <Button variant="secondary" isDisabled className="w-full">
                    <Clock size={17} />
                    {t("common.subscription.requestedCta")}
                  </Button>
                ) : (
                  <Button className="w-full" variant={plan.highlighted ? "primary" : "secondary"} onPress={() => setRequesting(plan)}>
                    <Crown size={17} variant="Bold" />
                    {t("common.subscription.requestPlan")}
                  </Button>
                )}
                {!isCurrent && !isFree && plan.contactMessage ? (
                  <p className="mt-3 text-center text-xs leading-5 text-muted">{plan.contactMessage}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <RequestPlanDialog
        plan={requesting}
        onClose={() => setRequesting(null)}
        onRequested={async () => {
          setRequesting(null);
          await refresh();
        }}
      />
    </div>
  );
}

function RequestPlanDialog({
  plan,
  onClose,
  onRequested,
}: {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onRequested: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (plan) setNote("");
  }, [plan]);

  if (!mounted) return null;

  async function submit() {
    if (!plan) return;
    setSaving(true);
    try {
      await subscriptionApi.requestSubscription(plan._id, note.trim() || undefined);
      showToast(t("common.subscription.requestSent"), "success");
      await onRequested();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <AppModal open={Boolean(plan)} onOpenChange={(open) => !open && onClose()} isDismissable={!saving}>
      <AppModalDialog className="sm:max-w-md">
        <AppModalHeader>
          <Modal.Heading>{t("common.subscription.requestDialogTitle", { plan: plan?.name ?? "" })}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm leading-7 text-muted">{t("common.subscription.requestDialogBody")}</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("common.subscription.requestNoteLabel")}</span>
            <TextArea
              variant="secondary"
              rows={3}
              className="w-full"
              placeholder={t("common.subscription.requestNotePlaceholder")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={saving} onPress={onClose}>
            {t("common.cancel")}
          </Button>
          <Button isPending={saving} onPress={() => void submit()}>
            {t("common.subscription.requestSubmit")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}
