"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Add, TickCircle, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as paymentPlansApi from "@/common/api/payment-plans";
import type {
  IMonthlyPaymentOverview,
  IPaymentPlan,
  IPaymentPlanOccurrence,
} from "@/common/interfaces/payment-plan.interface";
import { formatJalaliMonthYear, formatPrice, formatCount } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { CreatePaymentPlanModal } from "@/components/pages/planning/CreatePaymentPlanModal";
import { PayOccurrenceModal } from "@/components/pages/planning/PayOccurrenceModal";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

export function InstallmentsPage() {
  const { year, month, goToToday, shiftMonth } = usePeriodQuery(PATHS.INSTALLMENTS);

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<IMonthlyPaymentOverview | null>(null);
  const [plans, setPlans] = useState<IPaymentPlan[]>([]);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<IPaymentPlanOccurrence | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

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

  async function removePlan(plan: IPaymentPlan) {
    if (
      !confirm(
        `برنامه «${plan.title}» حذف شود؟\nاقساط در انتظار این برنامه هم حذف می‌شوند؛ پرداخت‌های ثبت‌شده باقی می‌مانند.`,
      )
    ) {
      return;
    }

    setDeletingPlanId(plan._id);
    try {
      await paymentPlansApi.deletePaymentPlan(plan._id);
      showToast("برنامه پرداخت حذف شد", "success");
      await load();
    } catch (err) {
      showErrorToast(err, "خطا در حذف برنامه");
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">برنامه‌ریزی مالی</p>
        <h1 className="mt-1 text-2xl font-bold">اقساط و پرداخت‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          اقساط ماهانه با یادآوری تلگرام و ثبت خودکار تراکنش هنگام پرداخت.
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
            <p className="text-sm text-muted">باقی‌مانده این ماه</p>
            <p className="mt-2 text-2xl font-bold text-expense">
              {formatPrice(monthlyData.pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(monthlyData.pendingCount)} قسط در انتظار
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">پرداخت‌شده این ماه</p>
            <p className="mt-2 text-2xl font-bold text-income">
              {formatPrice(monthlyData.paidAmount)}
            </p>
            <p className="mt-1 text-xs text-muted">{formatCount(monthlyData.paidCount)} قسط</p>
          </div>
        </div>
      )}

      <Button className="w-full" onPress={() => setCreatePlanOpen(true)}>
        <Add size={18} />
        برنامه پرداخت جدید
      </Button>

      {!loading && plans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">برنامه‌های پرداخت</h2>
            <span className="text-xs text-muted">{formatCount(plans.length)} برنامه</span>
          </div>
          {plans.map((plan) => (
            <article key={plan._id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{plan.title}</p>
                  <p className="mt-1 text-xs leading-6 text-muted">
                    {formatPrice(plan.amount)} · روز {plan.dueDayOfMonth} هر ماه
                    {plan.person ? ` · ${plan.person}` : ""}
                    {plan.totalInstallments
                      ? ` · ${formatCount(plan.completedInstallments)}/${formatCount(plan.totalInstallments)} قسط`
                      : ""}
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger"
                  aria-label={`حذف ${plan.title}`}
                  isPending={deletingPlanId === plan._id}
                  onPress={() => void removePlan(plan)}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted">در حال بارگذاری…</p>
      ) : !monthlyData?.occurrences.length ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          قسطی برای این ماه ثبت نشده. یک برنامه پرداخت ماهانه بسازید.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">اقساط {periodLabel}</h2>
          {monthlyData.occurrences.map((item) => (
            <div key={item._id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.plan.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    قسط {item.sequence}
                    {item.plan.totalInstallments
                      ? ` از ${item.plan.totalInstallments}`
                      : ""}{" "}
                    · روز {item.day}
                    {item.plan.person ? ` · ${item.plan.person}` : ""}
                  </p>
                </div>
                <p className="text-lg font-bold">{formatPrice(item.amount)}</p>
              </div>

              {item.status === "paid" ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-income">
                  <TickCircle size={18} variant="Bold" />
                  پرداخت شد
                  {item.payNote ? ` · ${item.payNote}` : ""}
                </div>
              ) : item.status === "skipped" ? (
                <p className="mt-3 text-sm text-muted">رد شده</p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onPress={() => setPayTarget(item)}
                  >
                    پرداخت شد
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onPress={() =>
                      void paymentPlansApi
                        .skipOccurrence(item._id)
                        .then(() => load())
                        .catch((err) => showErrorToast(err))
                    }
                  >
                    رد کردن
                  </Button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <CreatePaymentPlanModal
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
        onCreated={() => void load()}
      />
      <PayOccurrenceModal
        occurrence={payTarget}
        open={!!payTarget}
        onOpenChange={(open) => !open && setPayTarget(null)}
        onPaid={() => {
          setPayTarget(null);
          void load();
        }}
      />
    </div>
  );
}
