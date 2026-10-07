"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import { Gift } from "iconsax-reactjs";

import * as subscriptionApi from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import { toPersianDigits } from "@/common/utils";
import { formatIsoDateJalali } from "@/common/utils/jalali-date";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

export function StartTrialButton({ variant = "primary", className = "" }: { variant?: "primary" | "secondary"; className?: string }) {
  const { t } = useTranslation();
  const { refresh } = useSubscriptionAccess();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      await subscriptionApi.startTrial();
      showToast(t("common.trial.started"), "success");
      await refresh();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button className={className} variant={variant} isPending={busy} onPress={() => void start()}>
      <Gift size={18} variant="Bold" />
      {t("common.trial.start")}
    </Button>
  );
}

/** Offer shown on the plans page to accounts that have not used their trial. */
export function TrialCard() {
  const { t } = useTranslation();
  const { data } = useSubscriptionAccess();
  if (!data?.trial?.eligible) return null;
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-success/40 bg-gradient-to-l from-success/15 to-transparent p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/20 text-success-foreground">
          <Gift size={24} variant="Bold" />
        </span>
        <div>
          <p className="text-xs font-semibold text-success-foreground">{t("common.trial.badge")}</p>
          <h2 className="text-lg font-bold">{t("common.trial.cardTitle")}</h2>
          <p className="mt-1 max-w-xl text-sm leading-7 text-muted">{t("common.trial.cardBody")}</p>
        </div>
      </div>
      <StartTrialButton />
    </section>
  );
}

/** Reminder while the trial is running, with the way to keep the features. */
export function TrialActiveBanner() {
  const { t } = useTranslation();
  const { data } = useSubscriptionAccess();
  if (!data?.trial?.active) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
      <span className="font-semibold">
        <Gift size={18} variant="Bold" className="me-2 inline text-success-foreground" />
        {t("common.trial.activeBanner", { days: toPersianDigits(String(data.daysRemaining ?? 0)) })}
      </span>
    </div>
  );
}

/** Tells new accounts that the analysis page is open to them during week one. */
export function WelcomeDemoNotice() {
  const { t } = useTranslation();
  const { data } = useSubscriptionAccess();
  const demo = data?.welcomeDemo;
  if (!demo || demo.feature !== "analytics") return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
      <span className="font-medium">{t("common.trial.demoBanner", { date: formatIsoDateJalali(demo.endsAt) })}</span>
      <Link href={PATHS.PLANS} className="font-semibold text-accent">
        {t("common.trial.demoCta")}
      </Link>
    </div>
  );
}
