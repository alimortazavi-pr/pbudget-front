"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import * as analyticsApi from "@/common/api/analytics";
import * as boxesApi from "@/common/api/boxes";
import * as budgetsApi from "@/common/api/budgets";
import * as workTimeApi from "@/common/api/work-time";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import type {
  AnalyticsDuration,
  AnalyticsReport,
  AnalyticsTypeFilter,
} from "@/common/interfaces/analytics.interface";
import type {
  IWorkTimeAlert,
  IWorkTimeReport,
} from "@/common/interfaces/work-time.interface";
import { buildClientAnalyticsReport } from "@/common/utils/analytics-fallback";
import { getJalaliNow } from "@/common/utils/jalali-date";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { showToast } from "@/common/utils/toast";
import { AnalysisFilters } from "@/components/pages/analysis/AnalysisFilters";
import { AnalysisInsightsPanel } from "@/components/pages/analysis/AnalysisInsightsPanel";
import { AnalysisBudgetLimitsPanel } from "@/components/pages/analysis/AnalysisBudgetLimitsPanel";
import { AnalysisPaymentCardsPanel } from "@/components/pages/analysis/AnalysisPaymentCardsPanel";
import { WorkTimeAnalysisSection } from "@/components/pages/projects/WorkTimeAnalysisSection";
import { AnalysisKpiCards } from "@/components/pages/analysis/AnalysisKpiCards";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";

const AnalysisCharts = dynamic(
  () =>
    import("@/components/pages/analysis/AnalysisCharts").then(
      (mod) => mod.AnalysisCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-10 text-center text-muted">
        در حال رسم نمودارها…
      </div>
    ),
  },
);

export function AnalysisPage() {
  const router = useRouter();
  const { hydrated, get } = useHydratedSearchParams();
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);

  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [workReport, setWorkReport] = useState<IWorkTimeReport | null>(null);
  const [workAlerts, setWorkAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  const now = getJalaliNow();
  const duration = (hydrated ? get("duration", "monthly") : "monthly") as AnalyticsDuration;
  const year = hydrated ? get("year", String(now.jYear())) : String(now.jYear());
  const month = hydrated ? get("month", String(now.jMonth() + 1)) : String(now.jMonth() + 1);
  const day = hydrated ? get("day", String(now.jDate())) : String(now.jDate());
  const category = hydrated ? get("category", "") : "";
  const paymentCard = hydrated ? get("paymentCard", "") : "";
  const type = (hydrated ? get("type", "all") : "all") as AnalyticsTypeFilter;
  const compare = hydrated && get("compare") === "true";

  const queryKey = useMemo(
    () =>
      [duration, year, month, day, category, paymentCard, type, compare].join("|"),
    [duration, year, month, day, category, paymentCard, type, compare],
  );

  const updateQuery = useCallback(
    (patch: Record<string, string | boolean>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([key, value]) => {
        if (typeof value === "boolean") {
          if (value) params.set(key, "true");
          else params.delete(key);
          return;
        }
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(`/analysis?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function loadFallback() {
      const budgetDuration =
        duration === "daily" || duration === "monthly" ? duration : "monthly";

      const params: Record<string, string> = {
        duration: budgetDuration,
        year,
        month,
      };
      if (budgetDuration === "daily") params.day = day;
      if (category) params.category = category;

      const [budgetData, boxes] = await Promise.all([
        budgetsApi.fetchBudgets(params),
        boxesApi.fetchBoxes().catch(() => []),
      ]);

      const boxesTotal = boxes.reduce((sum, box) => sum + box.budget, 0);

      return buildClientAnalyticsReport({
        budgets: budgetData.budgets,
        totalIncomePrice: budgetData.totalIncomePrice,
        totalCostPrice: budgetData.totalCostPrice,
        userBalance: getWalletBalance(
          user,
          user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency,
        ),
        boxesTotal,
        duration,
        year,
        month,
        day,
        type,
      });
    }

    async function load() {
      setLoading(true);
      setUsedFallback(false);
      setWorkReport(null);
      setWorkAlerts([]);

      try {
        const requests: Promise<unknown>[] = [
          analyticsApi.fetchAnalyticsReport({
            duration,
            year,
            month,
            day,
            category: category || undefined,
            paymentCard: paymentCard || undefined,
            type,
            compare,
          }),
        ];

        if (duration === "monthly") {
          requests.push(
            workTimeApi.fetchWorkTimeReport(parseInt(year, 10), parseInt(month, 10)),
            workTimeApi.fetchWorkTimeAlerts(parseInt(year, 10), parseInt(month, 10)),
          );
        }

        const results = await Promise.allSettled(requests);
        const analyticsResult = results[0];

        if (analyticsResult.status === "fulfilled") {
          if (!cancelled) {
            setReport(analyticsResult.value as AnalyticsReport);
          }
        } else {
          throw analyticsResult.reason;
        }

        if (duration === "monthly" && results[1]?.status === "fulfilled") {
          if (!cancelled) {
            setWorkReport(results[1].value as IWorkTimeReport);
          }
        }
        if (duration === "monthly" && results[2]?.status === "fulfilled") {
          if (!cancelled) {
            setWorkAlerts(results[2].value as IWorkTimeAlert[]);
          }
        }
      } catch {
        try {
          const fallback = await loadFallback();
          if (!cancelled) {
            setReport(fallback);
            setUsedFallback(true);
            showToast("نمودارها از داده محلی ساخته شدند", "success");
          }
        } catch (err) {
          if (!cancelled) {
            setReport(null);
            showToast(
              err instanceof Error ? err.message : "خطا در بارگذاری تحلیل",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    queryKey,
    duration,
    year,
    month,
    day,
    category,
    paymentCard,
    type,
    compare,
    user?.walletBalances,
    user?.preferences?.currency,
  ]);

  return (
    <div className="space-y-4 pb-6 lg:space-y-6">
      <section className="pb-analysis-hero rounded-2xl p-5 lg:p-8">
        <p className="text-sm font-medium text-white/80">مرکز تحلیل مالی</p>
        <h1 className="mt-1 text-2xl font-bold text-white lg:text-3xl">
          تحلیل جامع وضعیت مالی
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75 lg:text-base">
          نمودارهای تعاملی درآمد و هزینه، توزیع دسته‌بندی‌ها، روند زمانی و
          بینش‌های عملی برای تصمیم‌گیری بهتر.
        </p>
      </section>

      <div data-tour="analysis-filters">
        <AnalysisFilters
          duration={duration}
          year={year}
          month={month}
          day={day}
          category={category}
          paymentCard={paymentCard}
          type={type}
          compare={compare}
          categories={categories ?? []}
          onChange={updateQuery}
        />
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          در حال آماده‌سازی تحلیل و نمودارها…
        </div>
      )}

      {!loading && !report && (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          داده‌ای برای نمایش نمودار موجود نیست.
        </div>
      )}

      {!loading && report && (
        <>
          {usedFallback && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              API تحلیل در دسترس نیست؛ نمودارها از تراکنش‌های همین بازه ساخته
              شده‌اند. برای تحلیل کامل، بک‌اند را deploy کنید.
            </div>
          )}

          <div data-tour="analysis-kpi">
            <AnalysisKpiCards report={report} />
          </div>

          <div data-tour="analysis-charts">
            <AnalysisCharts report={report} duration={duration} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AnalysisBudgetLimitsPanel report={report} />
            <AnalysisPaymentCardsPanel report={report} />
          </div>

          {report.comparison && (
            <section className="glass rounded-2xl border border-border/50 p-4 text-sm lg:p-5">
              <p className="font-semibold">مقایسه دوره‌ای</p>
              <p className="mt-1 text-muted">
                {report.comparison.currentPeriodLabel} در برابر{" "}
                {report.comparison.previousPeriodLabel}
              </p>
            </section>
          )}

          <AnalysisInsightsPanel
            insights={report.insights}
            periodLabel={report.filters.periodLabel}
          />

          {duration === "monthly" && workReport ? (
            <WorkTimeAnalysisSection report={workReport} alerts={workAlerts} />
          ) : null}
        </>
      )}
    </div>
  );
}
