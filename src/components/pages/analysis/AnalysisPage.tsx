"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";

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
import { getNowDateParts } from "@/common/utils/calendar-date";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { showToast } from "@/common/utils/toast";
import { shiftPeriod } from "@/common/utils/period-shift";
import { DashboardPeriodBar } from "@/components/pages/dashboard/DashboardOverview";
import { AnalysisFilterModal } from "@/components/pages/analysis/AnalysisFilterModal";
import { AnalysisHealth } from "@/components/pages/analysis/AnalysisHealth";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { Chart21, CloseCircle, Filter } from "iconsax-reactjs";
import type { AnalysisSection } from "@/components/pages/analysis/AnalysisCharts";
import { AnalysisInsightsPanel } from "@/components/pages/analysis/AnalysisInsightsPanel";
import { AnalysisBudgetLimitsPanel } from "@/components/pages/analysis/AnalysisBudgetLimitsPanel";
import { AnalysisPaymentCardsPanel } from "@/components/pages/analysis/AnalysisPaymentCardsPanel";
import { AnalysisFeatureSummary } from "@/components/pages/analysis/AnalysisFeatureSummary";
import { WorkTimeAnalysisSection } from "@/components/pages/projects/WorkTimeAnalysisSection";
import { AnalysisKpiCards } from "@/components/pages/analysis/AnalysisKpiCards";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { PageHeader } from "@/components/common/layout/PageHeader";

const AnalysisCharts = dynamic(
  () =>
    import("@/components/pages/analysis/AnalysisCharts").then(
      (mod) => mod.AnalysisCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-10 text-center text-muted">
        {t("auto.k05d296b25f")}
      </div>
    ),
  },
);

export function AnalysisPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hydrated, get } = useHydratedSearchParams();
  const categories = useAppSelector(categoriesSelector);
  const { isFeatureEnabled } = useSubscriptionAccess();
  const workTimeEnabled = isFeatureEnabled("work_time");
  const user = useAppSelector(userSelector);

  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [workReport, setWorkReport] = useState<IWorkTimeReport | null>(null);
  const [workAlerts, setWorkAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const [tab, setTab] = useState<"overview" | "expenses" | "income" | "assets" | "insights">("overview");
  const [filterOpen, setFilterOpen] = useState(false);
  const { formatMonthYear, formatDayMonthYear, formatCount } = useLocalizedDate();

  const calendarType = user?.preferences?.dateCalendar ?? "jalali";
  const nowParts = getNowDateParts(calendarType);
  const duration = (hydrated ? get("duration", "monthly") : "monthly") as AnalyticsDuration;
  const year = hydrated ? get("year", nowParts.year) : nowParts.year;
  const month = hydrated ? get("month", nowParts.month) : nowParts.month;
  const day = hydrated ? get("day", nowParts.day) : nowParts.day;
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

        if (duration === "monthly" && workTimeEnabled) {
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
            showToast(t("auto.kdcd636e2dc"), "success");
          }
        } catch (err) {
          if (!cancelled) {
            setReport(null);
            showToast(
              err instanceof Error ? err.message : t("pages.analysis.loadError"),
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
    t,
    user,
    user?.walletBalances,
    user?.preferences?.currency,
    workTimeEnabled,
  ]);

  const parts = { year, month, day };
  const unitOf = duration === "daily" ? "day" : duration === "yearly" ? "year" : "month";
  const shift = (delta: number) => updateQuery(shiftPeriod(calendarType, parts, delta, unitOf));
  const isCurrent =
    duration === "all" ||
    (String(year) === String(nowParts.year) &&
      (duration === "yearly" || String(month) === String(nowParts.month)) &&
      (duration !== "daily" || String(day) === String(nowParts.day)));
  const calendarKind = calendarType === "gregorian" ? "gregorian" : "jalali";
  const periodLabel =
    duration === "all"
      ? t("dashboard.allTimeLabel")
      : duration === "yearly"
        ? t("dashboard.yearLabel", { year: formatCount(parseInt(year, 10)).replace(/[,٬،]/g, "") })
        : duration === "daily"
          ? formatDayMonthYear(parseInt(day, 10), parseInt(month, 10), year, calendarKind)
          : formatMonthYear(parseInt(month, 10), year, calendarKind);
  const activeFilters = [category, paymentCard, type !== "all" ? type : ""].filter(Boolean).length;

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "overview", label: t("pages.analysis.tabOverview") },
    { id: "expenses", label: t("pages.analysis.tabExpenses") },
    { id: "income", label: t("pages.analysis.tabIncome") },
    { id: "assets", label: t("pages.analysis.tabAssets") },
    { id: "insights", label: t("pages.analysis.tabInsights") },
  ];
  const chartSection: AnalysisSection | null = tab === "insights" ? null : tab === "assets" ? "assets" : tab;

  return (
    <div className="space-y-4 pb-6 lg:space-y-5">
      <PageHeader icon={<Chart21 size={24} variant="Bold" />} title={t("pages.analysis.title")} description={t("pages.analysis.subtitle")} />

      <div data-tour="analysis-filters" className="space-y-3">
        <DashboardPeriodBar
          duration={duration}
          periodLabel={periodLabel}
          onDuration={(next) => updateQuery({ duration: next })}
          hideNav={duration === "all"}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
          onToday={() => updateQuery({ ...getNowDateParts(calendarType) })}
          isCurrentPeriod={isCurrent}
          filter={
            <button type="button" onClick={() => setFilterOpen(true)} className="pb-press pb-ghost-btn relative h-11 w-full justify-center" data-active={activeFilters > 0}>
              <Filter size={18} variant={activeFilters ? "Bold" : "Linear"} />
              <span>{t("dashboard.transactionFilters")}</span>
              {activeFilters ? <span className="pb-badge">{activeFilters}</span> : null}
            </button>
          }
        />
        {activeFilters || compare ? (
          <div className="pb-pop flex flex-wrap items-center gap-2">
            {type !== "all" ? (
              <button type="button" className="pb-chip" onClick={() => updateQuery({ type: "" })}>
                {t(type === "income" ? "dashboard.typeIncome" : "dashboard.typeExpense")}
                <CloseCircle size={14} variant="Bold" />
              </button>
            ) : null}
            {category ? (
              <button type="button" className="pb-chip" onClick={() => updateQuery({ category: "" })}>
                {(categories ?? []).find((c) => c._id === category)?.title ?? t("dashboard.filterByCategory")}
                <CloseCircle size={14} variant="Bold" />
              </button>
            ) : null}
            {paymentCard ? (
              <button type="button" className="pb-chip" onClick={() => updateQuery({ paymentCard: "" })}>
                {t("dashboard.filterCard")}
                <CloseCircle size={14} variant="Bold" />
              </button>
            ) : null}
            {compare ? (
              <button type="button" className="pb-chip" onClick={() => updateQuery({ compare: false })}>
                {t("pages.analysis.compareToPrevious")}
                <CloseCircle size={14} variant="Bold" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnalysisFilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        categories={categories ?? []}
        value={{ category, paymentCard, type, compare }}
        onApply={(value) =>
          updateQuery({
            category: value.category,
            paymentCard: value.paymentCard,
            type: value.type === "all" ? "" : value.type,
            compare: value.compare,
          })
        }
      />

      {loading && (
        <div className="space-y-3" aria-busy>
          <div className="pb-shimmer h-48 rounded-3xl" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="pb-shimmer h-28 rounded-2xl" />
            ))}
          </div>
          <div className="pb-shimmer h-72 rounded-3xl" />
        </div>
      )}

      {!loading && !report && (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          {t("pageHero.analysis.noData")}
        </div>
      )}

      {!loading && report && (
        <>
          {usedFallback && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              {t("pages.analysis.apiFallbackNotice")}
            </div>
          )}

          <AnalysisHealth report={report} />

          <div data-tour="analysis-kpi">
            <AnalysisKpiCards report={report} />
          </div>

          {report.comparison && (
            <p className="rounded-2xl border border-border/50 bg-surface-secondary/50 px-4 py-2.5 text-sm text-muted">
              {t("pages.analysis.comparedWith", { period: report.comparison.previousPeriodLabel })}
            </p>
          )}

          <div className="pb-tabs" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className="pb-tab"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div key={tab} className="pb-route space-y-4" data-tour="analysis-charts">
            {chartSection ? <AnalysisCharts report={report} duration={duration} section={chartSection} /> : null}
            {tab === "expenses" ? <AnalysisBudgetLimitsPanel report={report} /> : null}
            {tab === "assets" ? (
              <>
                <AnalysisFeatureSummary summary={report.featureSummary} />
                <AnalysisPaymentCardsPanel report={report} />
                {duration === "monthly" && workReport ? <WorkTimeAnalysisSection report={workReport} alerts={workAlerts} /> : null}
              </>
            ) : null}
            {tab === "insights" ? (
              <AnalysisInsightsPanel insights={report.insights} periodLabel={report.filters.periodLabel} />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
