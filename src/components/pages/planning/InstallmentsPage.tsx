"use client";

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
import { CreatePaymentPlanModal } from "@/components/pages/planning/CreatePaymentPlanModal";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

export function InstallmentsPage() {
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
      showErrorToast(err, "خطا در بارگذاری");
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
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">برنامه‌ریزی مالی</p>
        <h1 className="mt-1 text-2xl font-bold">اقساط و پرداخت‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          برنامه پرداخت بسازید؛ اقساط، پرداخت‌ها و تراکنش‌ها را در صفحه هر برنامه ببینید.
        </p>
      </section>

      <PeriodNavigator
        label={periodLabel}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={goToToday}
      />

      {monthlyData && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">باقی‌مانده {periodLabel}</p>
            <p className="mt-2 text-2xl font-bold text-expense">
              {formatPrice(monthlyData.pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(monthlyData.pendingCount)} قسط در انتظار
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">پرداخت‌شده {periodLabel}</p>
            <p className="mt-2 text-2xl font-bold text-income">
              {formatPrice(monthlyData.paidAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">{formatCount(monthlyData.paidCount)} قسط</p>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">برنامه‌ها</p>
            <p className="mt-2 text-xl font-bold">{formatCount(planSummary.count)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">فعال</p>
            <p className="mt-2 text-xl font-bold text-income">
              {formatCount(planSummary.active)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">اقساط پرداخت‌شده</p>
            <p className="mt-2 text-xl font-bold">{formatCount(planSummary.installments)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{formatCount(plans.length)} برنامه پرداخت</p>
        <Button size="sm" onPress={() => setCreatePlanOpen(true)}>
          <Add size={18} />
          برنامه جدید
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
      ) : plans.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Wallet size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">هنوز برنامه پرداختی ثبت نشده</p>
          <Button className="mt-4" onPress={() => setCreatePlanOpen(true)}>
            <Add size={18} />
            اولین برنامه
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
                        {plan.active ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {formatPrice(plan.amount)} · روز {plan.dueDayOfMonth} هر ماه
                      {plan.person ? ` · ${plan.person}` : ""}
                    </p>
                  </div>
                  <Calendar size={22} className="shrink-0 text-accent" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
                  <div className="rounded-xl bg-surface-secondary p-2">
                    <p className="text-muted">هر قسط</p>
                    <p className="mt-1 font-semibold">{formatPrice(plan.amount)}</p>
                  </div>
                  <div className="rounded-xl bg-income-soft/50 p-2">
                    <p className="text-muted">پرداخت‌شده</p>
                    <p className="mt-1 font-semibold text-income">
                      {formatCount(plan.completedInstallments)} قسط
                    </p>
                  </div>
                  <div className="rounded-xl bg-expense-soft/50 p-2 col-span-2 sm:col-span-1">
                    <p className="text-muted">کل برنامه</p>
                    <p className="mt-1 font-semibold">
                      {plan.totalInstallments
                        ? formatCount(plan.totalInstallments)
                        : "نامحدود"}
                    </p>
                  </div>
                </div>

                {progress !== null && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>پیشرفت</span>
                      <span>{Math.round(progress)}٪</span>
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
          <h2 className="text-sm font-semibold">اقساط {periodLabel}</h2>
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
                      {typeof item.plan === "object" ? item.plan.title : "برنامه پرداخت"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      قسط {item.sequence} · روز {item.day} ·{" "}
                      {item.status === "paid"
                        ? "پرداخت‌شده"
                        : item.status === "skipped"
                          ? "رد شده"
                          : "در انتظار"}
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
