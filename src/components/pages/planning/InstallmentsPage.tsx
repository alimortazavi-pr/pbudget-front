"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, Calendar, Wallet } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as paymentPlansApi from "@/common/api/payment-plans";
import type {
  IMonthlyPaymentOverview,
  IPaymentPlan,
} from "@/common/interfaces/payment-plan.interface";
import { formatJalaliMonthYear, formatPrice, formatCount } from "@/common/utils";
import { showErrorToast } from "@/common/utils/toast";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { CreatePaymentPlanModal } from "@/components/pages/planning/CreatePaymentPlanModal";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

export function InstallmentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { year, month, goToToday, shiftMonth } = usePeriodQuery(PATHS.INSTALLMENTS);

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<IMonthlyPaymentOverview | null>(null);
  const [plans, setPlans] = useState<IPaymentPlan[]>([]);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);

  const periodLabel = useMemo(
    () => formatJalaliMonthYear(year, month),
    [year, month],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, planList] = await Promise.all([
        paymentPlansApi.fetchMonthlyPayments(year, month),
        paymentPlansApi.fetchPaymentPlans(),
      ]);
      setMonthlyData(data);
      setPlans(planList);
    } catch (err) {
      showErrorToast(err, t("pages.planning.loadError"));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const planSummary = useMemo(() => {
    return plans.reduce(
      (acc, plan) => {
        acc.count += 1;
        if (plan.active) acc.active += 1;
        acc.installments += plan.completedInstallments;
        return acc;
      },
      { count: 0, active: 0, installments: 0 },
    );
  }, [plans]);

  return (
    <div className="space-y-5 pb-6">
      <PageHeroSection
        variant="violet"
        eyebrow={t("pageHero.installments.eyebrow")}
        title={t("nav.installments")}
        description={t("pageHero.installments.description")}
      />

      <PeriodNavigator
        label={periodLabel}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={goToToday}
      />

      {monthlyData && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("debts.remaining")}{periodLabel}</p>
            <p className="mt-2 text-2xl font-bold text-expense">
              {formatPrice(monthlyData.pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(monthlyData.pendingCount)} {t("auto.ked1b246579")}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.k4db2de0c95")}{periodLabel}</p>
            <p className="mt-2 text-2xl font-bold text-income">
              {formatPrice(monthlyData.paidAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">{formatCount(monthlyData.paidCount)} {t("auto.kd673bbfe0f")}</p>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.kf732e5ac72")}</p>
            <p className="mt-2 text-xl font-bold">{formatCount(planSummary.count)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.k25c499f433")}</p>
            <p className="mt-2 text-xl font-bold text-income">
              {formatCount(planSummary.active)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.ka70ebd87b1")}</p>
            <p className="mt-2 text-xl font-bold">{formatCount(planSummary.installments)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{formatCount(plans.length)} {t("auto.k2234933fad")}</p>
        <Button size="sm" onPress={() => setCreatePlanOpen(true)}>
          <Add size={18} />
          {t("auto.ka5b452289b")}
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
      ) : plans.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Wallet size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{t("auto.kb79e02bfee")}</p>
          <Button className="mt-4" onPress={() => setCreatePlanOpen(true)}>
            <Add size={18} />
            {t("auto.ke4cc5b8b99")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const progress =
              plan.totalInstallments && plan.totalInstallments > 0
                ? Math.min((plan.completedInstallments / plan.totalInstallments) * 100, 100)
                : null;

            return (
              <Link
                key={plan._id}
                href={PATHS.INSTALLMENT_PLAN(plan._id)}
                className="block glass rounded-2xl p-4 transition hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold">{plan.title}</h2>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                          plan.active
                            ? "bg-income-soft text-income"
                            : "bg-surface-secondary text-muted"
                        }`}
                      >
                        {plan.active ? t("pages.planning.installmentActive") : t("pages.planning.installmentInactive")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {formatPrice(plan.amount)} · {t("auto.k6702edb75e")}{plan.dueDayOfMonth} {t("auto.k63c83a62df")}
                      {plan.person ? ` · ${plan.person}` : ""}
                    </p>
                  </div>
                  <Calendar size={22} className="shrink-0 text-accent" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
                  <div className="rounded-xl bg-surface-secondary p-2">
                    <p className="text-muted">{t("auto.kc959cf91d5")}</p>
                    <p className="mt-1 font-semibold">{formatPrice(plan.amount)}</p>
                  </div>
                  <div className="rounded-xl bg-income-soft/50 p-2">
                    <p className="text-muted">{t("auto.k4db2de0c95")}</p>
                    <p className="mt-1 font-semibold text-income">
                      {formatCount(plan.completedInstallments)} {t("auto.kd673bbfe0f")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-expense-soft/50 p-2 col-span-2 sm:col-span-1">
                    <p className="text-muted">{t("auto.k3f032bc5c4")}</p>
                    <p className="mt-1 font-semibold">
                      {plan.totalInstallments
                        ? formatCount(plan.totalInstallments)
                        : t("pages.planning.installmentUnlimited")}
                    </p>
                  </div>
                </div>

                {progress !== null && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>{t("auto.k9998d1625f")}</span>
                      <span>{Math.round(progress)}{t("common.percentSign")}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && monthlyData && monthlyData.occurrences.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("nav.installments")}{periodLabel}</h2>
          {monthlyData.occurrences.map((item) => {
            const planId =
              typeof item.plan === "object" && item.plan?._id
                ? item.plan._id
                : typeof item.plan === "string"
                  ? item.plan
                  : null;

            return (
              <Link
                key={item._id}
                href={planId ? PATHS.INSTALLMENT_PLAN(planId) : PATHS.INSTALLMENTS}
                className="block glass rounded-2xl p-4 transition hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {typeof item.plan === "object" ? item.plan.title : t("pages.planning.installmentDefaultTitle")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t("auto.kd673bbfe0f")}{item.sequence} · {t("auto.k6702edb75e")}{item.day} ·{" "}
                      {item.status === "paid"
                        ? t("pages.planning.installmentPaid")
                        : item.status === "skipped"
                          ? t("pages.planning.installmentRejected")
                          : t("pages.planning.installmentPending")}
                    </p>
                  </div>
                  <p className="text-lg font-bold">{formatPrice(item.amount)}</p>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <CreatePaymentPlanModal
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
        onCreated={(planId) => {
          if (planId) {
            router.push(PATHS.INSTALLMENT_PLAN(planId));
            return;
          }
          void load();
        }}
      />
    </div>
  );
}
