"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, TextArea } from "@heroui/react";
import { Clock, Crown, Lock1, Refresh2, TickCircle, Timer1, Warning2 } from "iconsax-reactjs";
import { createPortal } from "react-dom";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { SubscriptionPlan, UserSubscription } from "@/common/interfaces/subscription.interface";
import {
  BazaarError,
  isBazaarBillingAvailable,
  pendingBazaarPurchases,
  purchaseWithBazaar,
} from "@/common/native/bazaar";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { formatIsoDateJalali } from "@/common/utils/jalali-date";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

const EXPIRING_SOON_DAYS = 7;
const HISTORY_PREVIEW = 4;

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

function planOf(subscription: UserSubscription) {
  return subscription.plan?.name ?? subscription.planSnapshot?.name ?? "";
}

export function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const periodLabel = usePeriodLabel();
  const userId = useAppSelector(userSelector)?._id;
  const { data: mine, error: accessError, refresh } = useSubscriptionAccess();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansFailed, setPlansFailed] = useState(false);
  const [history, setHistory] = useState<UserSubscription[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [requesting, setRequesting] = useState<SubscriptionPlan | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  // Decided after mount: the native bridge does not exist on the server render.
  const [bazaarReady, setBazaarReady] = useState(false);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansFailed(false);
    try {
      setPlans(await subscriptionApi.fetchPublicSubscriptionPlans());
    } catch {
      setPlansFailed(true);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await subscriptionApi.fetchMySubscriptionHistory());
    } catch {
      // The history is secondary; the page works without it.
    }
  }, []);

  useEffect(() => {
    setBazaarReady(isBazaarBillingAvailable());
    void loadPlans();
    void loadHistory();
    void refresh();
  }, [loadPlans, loadHistory, refresh]);

  // A purchase paid for but never redeemed (app killed, network dropped) is
  // still listed by Bazaar as unconsumed: hand it to the server again.
  useEffect(() => {
    if (!bazaarReady || !userId) return;
    let cancelled = false;
    void (async () => {
      let recovered = false;
      for (const purchase of await pendingBazaarPurchases(userId)) {
        try {
          await subscriptionApi.verifyBazaarPurchase({
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
            orderId: purchase.orderId,
          });
          recovered = true;
        } catch {
          // Stays pending in Bazaar; the next visit tries again.
        }
      }
      if (recovered && !cancelled) {
        showToast(t("common.subscription.purchaseRecovered"), "success");
        await refresh();
        await loadHistory();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bazaarReady, userId, refresh, loadHistory, t]);

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
  const currentIsFree = current ? (current.plan?.price ?? current.planSnapshot?.price ?? 0) === 0 : true;
  const pending = mine?.pendingRequest ?? null;
  const pendingPlanId = typeof pending?.plan === "object" ? pending?.plan?._id : (pending?.plan as unknown as string | undefined);
  const upcoming = mine?.upcoming ?? null;
  const days = mine?.daysRemaining;
  const expiringSoon = !currentIsFree && days != null && days <= EXPIRING_SOON_DAYS;

  async function cancelRequest() {
    setCanceling(true);
    try {
      await subscriptionApi.cancelSubscriptionRequest();
      showToast(t("common.subscription.requestCanceled"), "success");
      await refresh();
      await loadHistory();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setCanceling(false);
    }
  }

  async function buyWithBazaar(plan: SubscriptionPlan) {
    if (!plan.bazaarProductId || !userId) return;
    setBuyingPlanId(plan._id);
    try {
      const purchase = await purchaseWithBazaar(plan.bazaarProductId, userId);
      await subscriptionApi.verifyBazaarPurchase({
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId,
      });
      showToast(t("common.subscription.purchaseSuccess"), "success");
      await refresh();
      await loadHistory();
    } catch (error) {
      if (error instanceof BazaarError) {
        if (error.code === "bazaar_missing") showToast(t("common.subscription.bazaarMissing"), "danger");
        else if (error.code === "failed") showToast(t("common.subscription.purchaseFailed"), "danger");
        // "canceled" is the user's own choice: say nothing.
      } else {
        // Paid, but the server could not confirm it yet: it is picked up again on the next visit.
        showToast(t("common.subscription.purchaseUnconfirmed"), "danger");
      }
    } finally {
      setBuyingPlanId(null);
    }
  }

  const visibleHistory = showAllHistory ? history : history.slice(0, HISTORY_PREVIEW);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        icon={<Crown size={24} variant="Bold" />}
        title={t("common.subscription.plansTitle")}
        description={t("common.subscription.plansDescription")}
      />

      {accessError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Warning2 size={22} className="mt-0.5 shrink-0 text-warning-foreground" variant="Bold" />
            <p className="text-sm font-medium">{t("common.subscription.statusStale")}</p>
          </div>
          <Button size="sm" variant="ghost" onPress={() => void refresh()}>
            <Refresh2 size={16} />
            {t("common.subscription.retry")}
          </Button>
        </div>
      ) : null}

      {current ? (
        <div className="rounded-2xl border border-border/60 bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success-foreground">
                <TickCircle size={20} variant="Bold" />
              </span>
              <div>
                <p className="text-xs text-muted">{t("common.subscription.currentPlan")}</p>
                <p className="font-bold">{planOf(current)}</p>
                {current.expiresAt ? (
                  <p className="text-xs text-muted">
                    {t("common.subscription.endsOn", { date: formatIsoDateJalali(current.expiresAt) })}
                  </p>
                ) : null}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                expiringSoon ? "bg-warning/20 text-warning-foreground" : "bg-surface-secondary text-muted"
              }`}
            >
              <Timer1 size={14} />
              {days == null
                ? t("common.subscription.neverExpires")
                : expiringSoon
                  ? t("common.subscription.expiresSoon", { days })
                  : t("common.subscription.daysLeft", { days })}
            </span>
          </div>
          {currentIsFree ? <p className="mt-3 text-sm text-muted">{t("common.subscription.freePlanHint")}</p> : null}
          {upcoming ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm">
              <Clock size={16} className="shrink-0 text-accent" />
              {t("common.subscription.scheduledPlan", {
                plan: planOf(upcoming),
                date: formatIsoDateJalali(upcoming.startsAt),
              })}
            </p>
          ) : null}
          {expiringSoon ? <p className="mt-3 text-xs text-muted">{t("common.subscription.earlyRenewNote")}</p> : null}
        </div>
      ) : null}

      {pending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Clock size={22} className="mt-0.5 shrink-0 text-warning-foreground" variant="Bold" />
            <div>
              <p className="font-semibold">{t("common.subscription.pendingRequest", { plan: planOf(pending) })}</p>
              <p className="mt-0.5 text-xs text-muted">{t("common.subscription.pendingRequestHint")}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" isPending={canceling} onPress={() => void cancelRequest()}>
            {t("common.subscription.cancelRequest")}
          </Button>
        </div>
      ) : null}

      {plansLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" />
          <div className="h-96 animate-pulse rounded-3xl bg-surface-secondary" />
        </div>
      ) : plansFailed ? (
        <div className="rounded-3xl border border-border/60 bg-surface p-10 text-center">
          <p className="text-muted">{t("common.subscription.loadError")}</p>
          <Button className="mt-4" variant="secondary" onPress={() => void loadPlans()}>
            <Refresh2 size={16} />
            {t("common.subscription.retry")}
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-surface p-10 text-center text-muted">{t("common.subscription.noPlans")}</div>
      ) : (
        <div className={`grid gap-5 ${plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "lg:grid-cols-2" : "mx-auto max-w-md"}`}>
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentSlug;
            const isRequested = pendingPlanId === plan._id;
            const isFree = plan.price === 0;
            const canBuyInBazaar = bazaarReady && Boolean(plan.bazaarProductId);
            const isBuying = buyingPlanId === plan._id;
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
                    const enabled = Boolean(plan.features.find((item) => item.key === catalogFeature.key)?.enabled);
                    return (
                      <li key={catalogFeature.key} className={`flex items-center gap-2.5 text-sm ${enabled ? "" : "text-muted"}`}>
                        {enabled ? (
                          <TickCircle size={18} className="shrink-0 text-success" variant="Bold" />
                        ) : (
                          <Lock1 size={16} className="shrink-0 text-muted/70" />
                        )}
                        <span className={enabled ? "" : "line-through decoration-muted/40"}>{catalogFeature.label}</span>
                      </li>
                    );
                  })}
                </ul>

                {isFree ? (
                  isCurrent ? (
                    <Button variant="secondary" isDisabled className="w-full">
                      {t("common.subscription.currentPlanCta")}
                    </Button>
                  ) : null
                ) : isRequested ? (
                  <Button variant="secondary" isDisabled className="w-full">
                    <Clock size={17} />
                    {t("common.subscription.requestedCta")}
                  </Button>
                ) : canBuyInBazaar ? (
                  <Button
                    className="w-full"
                    variant={plan.highlighted || isCurrent ? "primary" : "secondary"}
                    isPending={isBuying}
                    isDisabled={buyingPlanId !== null && !isBuying}
                    onPress={() => void buyWithBazaar(plan)}
                  >
                    <Crown size={17} variant="Bold" />
                    {isCurrent ? t("common.subscription.renew") : t("common.subscription.buyWithBazaar")}
                  </Button>
                ) : (
                  <>
                    <Button className="w-full" variant={plan.highlighted || isCurrent ? "primary" : "secondary"} onPress={() => setRequesting(plan)}>
                      <Crown size={17} variant="Bold" />
                      {isCurrent ? t("common.subscription.renew") : t("common.subscription.requestPlan")}
                    </Button>
                    {plan.contactMessage ? <p className="mt-3 text-center text-xs leading-5 text-muted">{plan.contactMessage}</p> : null}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {history.length > 0 ? (
        <section className="rounded-3xl border border-border/60 bg-surface p-5">
          <h2 className="text-lg font-bold">{t("common.subscription.historyTitle")}</h2>
          <ul className="mt-3 divide-y divide-border/50">
            {visibleHistory.map((item) => (
              <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{planOf(item)}</p>
                  <p className="text-xs text-muted">
                    {formatIsoDateJalali(item.startsAt)}
                    {item.expiresAt ? ` ← ${formatIsoDateJalali(item.expiresAt)}` : ` · ${t("common.subscription.neverExpires")}`}
                    {item.source === "bazaar" ? ` · ${t("common.subscription.sourceBazaar")}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted">{statusLabel(item, t)}</span>
              </li>
            ))}
          </ul>
          {history.length > HISTORY_PREVIEW ? (
            <Button className="mt-2" size="sm" variant="ghost" onPress={() => setShowAllHistory((value) => !value)}>
              {showAllHistory ? t("common.subscription.showLess") : t("common.subscription.showAll")}
            </Button>
          ) : null}
        </section>
      ) : null}

      <RequestPlanDialog
        plan={requesting}
        onClose={() => setRequesting(null)}
        onRequested={async () => {
          setRequesting(null);
          await refresh();
          await loadHistory();
        }}
      />
    </div>
  );
}

function statusLabel(item: UserSubscription, t: (key: string) => string) {
  // "Scheduled" is not a stored status: it is an active subscription that has not started yet.
  if (item.status === "active" && new Date(item.startsAt).getTime() > Date.now()) return t("common.subscription.status.scheduled");
  return t(`common.subscription.status.${item.status}`);
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
