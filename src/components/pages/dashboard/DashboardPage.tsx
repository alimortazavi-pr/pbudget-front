"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import { PATHS } from "@/common/constants";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { getJalaliNow } from "@/common/utils";
import { formatBudgetDate, getNowDateParts } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { resolveBudgetCurrency, resolveBudgetDateCalendar, type UserCurrency } from "@/common/constants/user-preferences";
import { BudgetType } from "@/types/enums";
import moment from "moment-jalali";
import { showToast } from "@/common/utils/toast";
import { BudgetExportModal } from "@/components/pages/dashboard/BudgetExportModal";
import { DashboardInsights, DashboardKpis, DashboardPeriodBar } from "@/components/pages/dashboard/DashboardOverview";
import { DashboardFilterSection } from "@/components/pages/dashboard/DashboardFilterSection";
import { DashboardHero } from "@/components/pages/dashboard/DashboardHero";
import { WorkTimeQuickWidget } from "@/components/pages/projects/WorkTimeQuickWidget";
import { HmiDashboardPage } from "@/components/pages/dashboard/HmiDashboardPage";
import { TransactionCard } from "@/components/pages/dashboard/TransactionCard";
import { TransactionListSkeleton } from "@/components/pages/dashboard/TransactionListSkeleton";
import type { IBudget, IBudgetsSummary } from "@/common/interfaces/budget.interface";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  budgetsSelector,
  budgetRevisionSelector,
  setBudgets,
  totalCostSelector,
  totalIncomeSelector,
} from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { useAppMode } from "@/components/providers/AppModeProvider";
import { userSelector } from "@/stores/profile";

type DashboardPageProps = {
  initialData?: IBudgetsSummary;
};

export function DashboardPage({ initialData }: DashboardPageProps) {
  const { t } = useTranslation();
  const { appMode } = useAppMode();
  const { formatMonthYear, formatDayMonthYear, formatCount } = useLocalizedDate();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { hydrated, get } = useHydratedSearchParams();

  const budgets = useAppSelector(budgetsSelector);
  const totalIncome = useAppSelector(totalIncomeSelector);
  const totalCost = useAppSelector(totalCostSelector);
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const budgetRevision = useAppSelector(budgetRevisionSelector);

  const [loading, setLoading] = useState(!initialData);
  const [otherCurrencyTotals, setOtherCurrencyTotals] = useState<
    { currency: string; income: number; cost: number; count: number }[]
  >([]);
  const [exportOpen, setExportOpen] = useState(false);
  const hasLoadedOnce = useRef(Boolean(initialData));

  const calendarType = user?.preferences?.dateCalendar || "jalali";
  const nowParts = useMemo(() => getNowDateParts(calendarType), [calendarType]);
  const duration = hydrated ? get("duration", "monthly") : "monthly";
  const year = hydrated ? get("year", nowParts.year) : nowParts.year;
  const month = hydrated ? get("month", nowParts.month) : nowParts.month;
  const day = hydrated ? get("day", nowParts.day) : nowParts.day;
  const category = hydrated ? get("category", "") : "";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("duration", duration);
    params.set("year", year);
    params.set("month", month);
    if (duration === "daily") params.set("day", day);
    if (category) params.set("category", category);
    return params.toString();
  }, [duration, year, month, day, category]);

  const updateQuery = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`${PATHS.HOME}?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const prevCalendarRef = useRef(calendarType);
  useEffect(() => {
    if (prevCalendarRef.current === calendarType) return;
    prevCalendarRef.current = calendarType;
    updateQuery(getNowDateParts(calendarType));
  }, [calendarType, updateQuery]);

  useEffect(() => {
    if (initialData) {
      dispatch(setBudgets(initialData));
      setLoading(false);
    }
  }, [dispatch, initialData]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasLoadedOnce.current) setLoading(true);
      try {
        const data = await budgetsApi.fetchBudgets(
          Object.fromEntries(new URLSearchParams(queryString)),
        );
        if (!cancelled) {
          dispatch(setBudgets(data));
          setOtherCurrencyTotals(
            Object.entries(data.totalsByCurrency ?? {})
              .filter(([currency]) => currency !== (data.currency ?? "toman"))
              .map(([currency, totals]) => ({ currency, ...totals })),
          );
        }
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : t("dashboard.fetchTransactionsError"),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, queryString, budgetRevision, t]);

  const filteredBudgets = useMemo(() => budgets ?? [], [budgets]);

  // Group by transaction day so a month reads like a statement.
  const dayGroups = useMemo(() => {
    const groups: { key: string; budgets: IBudget[]; income: number; cost: number }[] = [];
    for (const budget of filteredBudgets) {
      const key = `${budget.year}-${budget.month}-${budget.day}`;
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, budgets: [], income: 0, cost: 0 };
        groups.push(group);
      }
      group.budgets.push(budget);
      const sameCurrency = resolveBudgetCurrency(budget.currency) === (user?.preferences?.currency ?? "toman");
      if (sameCurrency) {
        if (budget.type === BudgetType.INCOME) group.income += budget.price;
        else group.cost += budget.price;
      }
    }
    return groups;
  }, [filteredBudgets, user?.preferences?.currency]);

  /** Year/month/day of the period `delta` steps away (month or day). */
  const shiftedParts = useCallback(
    (delta: number, unit: "month" | "day") => {
      if (calendarType === "gregorian") {
        const m = moment()
          .year(parseInt(year, 10))
          .month(parseInt(month, 10) - 1)
          .date(unit === "day" ? parseInt(day, 10) : 1)
          .add(delta, unit);
        return { year: String(m.year()), month: String(m.month() + 1), day: String(m.date()) };
      }
      const m = getJalaliNow()
        .jYear(parseInt(year, 10))
        .jMonth(parseInt(month, 10) - 1)
        .jDate(unit === "day" ? parseInt(day, 10) : 1)
        .add(delta, unit === "day" ? "day" : "jMonth");
      return { year: String(m.jYear()), month: String(m.jMonth() + 1), day: String(m.jDate()) };
    },
    [calendarType, year, month, day],
  );

  function shiftMonth(delta: number) {
    updateQuery(shiftedParts(delta, "month"));
  }

  function shiftDay(delta: number) {
    updateQuery(shiftedParts(delta, "day"));
  }

  // Same-length previous period, for the "vs last period" deltas on the KPIs.
  const [previousTotals, setPreviousTotals] = useState<{ income: number; cost: number } | null>(null);
  useEffect(() => {
    if (!hydrated || appMode !== "advanced") return;
    let cancelled = false;
    const prev = shiftedParts(-1, duration === "daily" ? "day" : "month");
    const params: Record<string, string> = { duration, year: prev.year, month: prev.month };
    if (duration === "daily") params.day = prev.day;
    if (category) params.category = category;
    budgetsApi
      .fetchBudgets(params)
      .then((data) => {
        if (!cancelled) setPreviousTotals({ income: data.totalIncomePrice ?? 0, cost: data.totalCostPrice ?? 0 });
      })
      .catch(() => {
        if (!cancelled) setPreviousTotals(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, appMode, duration, category, shiftedParts, budgetRevision]);

  const isCurrentPeriod =
    String(year) === String(nowParts.year) &&
    String(month) === String(nowParts.month) &&
    (duration !== "daily" || String(day) === String(nowParts.day));

  function setDuration(nextDuration: "monthly" | "daily") {
    if (nextDuration === duration) return;
    if (nextDuration === "daily") {
      updateQuery({ duration: "daily", year, month, day });
      return;
    }
    updateQuery({ duration: "monthly", year, month, day: "" });
  }

  const periodLabel =
    calendarType === "gregorian"
      ? duration === "daily"
        ? formatDayMonthYear(
            parseInt(day, 10),
            parseInt(month, 10),
            year,
            "gregorian",
          )
        : formatMonthYear(parseInt(month, 10), year, "gregorian")
      : duration === "daily"
        ? formatDayMonthYear(
            parseInt(day, 10),
            parseInt(month, 10),
            year,
            "jalali",
          )
        : formatMonthYear(parseInt(month, 10), year, "jalali");

  if (appMode !== "advanced") {
    return (
      <HmiDashboardPage
        mode={appMode}
        user={user}
        budgets={filteredBudgets}
        totalIncome={totalIncome ?? 0}
        totalCost={totalCost ?? 0}
        loading={loading}
        periodLabel={periodLabel}
        duration={duration}
        year={year}
        month={month}
        day={day}
        calendarType={calendarType}
        onShiftMonth={shiftMonth}
        onShiftDay={shiftDay}
        onDurationChange={setDuration}
        onSelectDate={(nextDate) =>
          updateQuery({ duration: "daily", ...nextDate })
        }
      />
    );
  }

  const preferredCurrency = resolveBudgetCurrency(user?.preferences?.currency);

  return (
    <div className="pb-dashboard-page">
      <DashboardHero
        firstName={user?.firstName}
        income={totalIncome ?? 0}
        expense={totalCost ?? 0}
        data-tour="dashboard-balance"
      />

      <DashboardPeriodBar
        duration={duration}
        periodLabel={periodLabel}
        onDuration={setDuration}
        onPrev={() => (duration === "daily" ? shiftDay(-1) : shiftMonth(-1))}
        onNext={() => (duration === "daily" ? shiftDay(1) : shiftMonth(1))}
        onToday={() => updateQuery({ ...getNowDateParts(calendarType) })}
        isCurrentPeriod={isCurrentPeriod}
        onExport={() => setExportOpen(true)}
        filter={
          <DashboardFilterSection
            inline
            categories={categories ?? []}
            category={category}
            year={year}
            month={month}
            day={day}
            onCategoryChange={(nextCategory) => updateQuery({ category: nextCategory })}
            onApplyFilter={(patch) =>
              updateQuery({ category: patch.category, year: patch.year, month: patch.month, day: patch.day })
            }
          />
        }
      />

      <DashboardKpis
        current={{ income: totalIncome ?? 0, cost: totalCost ?? 0 }}
        previous={previousTotals}
        count={filteredBudgets.length}
        currency={preferredCurrency}
      />

      <WorkTimeQuickWidget />

      <BudgetExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={categories ?? []}
        initialCategory={category}
        initialYear={year}
        initialMonth={month}
        initialDay={day}
        initialDuration={duration === "daily" ? "daily" : "monthly"}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold lg:text-lg">{t("dashboard.transactions")}</h3>
            {filteredBudgets.length ? (
              <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-muted">
                {t("dashboard.transactionCountInRange", { count: formatCount(filteredBudgets.length) })}
              </span>
            ) : null}
          </div>

          {loading ? (
            <TransactionListSkeleton />
          ) : filteredBudgets.length === 0 ? (
            <div className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-12 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Filter size={26} variant="Bulk" />
              </span>
              <p className="font-bold">{t("dashboard.noTransactionsFound")}</p>
              <p className="mt-1 max-w-xs text-sm text-muted">{t("dashboard.noTransactionsInRange")}</p>
              <div className="mt-5 flex gap-2">
                <Link href={`${PATHS.CREATE_BUDGET}?type=1`} className="pb-press pb-ghost-btn">
                  {t("dashboard.quickExpense")}
                </Link>
                <Link href={`${PATHS.CREATE_BUDGET}?type=0`} className="pb-press pb-ghost-btn">
                  {t("dashboard.quickIncome")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5" data-tour="dashboard-transactions">
              {otherCurrencyTotals.length ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {otherCurrencyTotals.map((row) => (
                    <span key={row.currency} className="rounded-full bg-surface-secondary px-3 py-1 text-muted">
                      {formatPriceWithCurrency(row.income, resolveBudgetCurrency(row.currency as UserCurrency))} ↓ ·{" "}
                      {formatPriceWithCurrency(row.cost, resolveBudgetCurrency(row.currency as UserCurrency))} ↑
                    </span>
                  ))}
                </div>
              ) : null}
              {dayGroups.map((group, groupIndex) => {
                const first = group.budgets[0];
                const net = group.income - group.cost;
                return (
                  <section key={group.key} className="flex flex-col gap-2.5 lg:gap-3">
                    {duration !== "daily" ? (
                      <div className="pb-day-header">
                        <span className="text-foreground/80">
                          {formatBudgetDate(first.year, first.month, first.day, resolveBudgetDateCalendar(first.dateCalendar))}
                        </span>
                        {net !== 0 ? (
                          <span className={net > 0 ? "text-income" : "text-expense"}>
                            {net > 0 ? "+" : "−"}
                            {formatPriceWithCurrency(Math.abs(net), preferredCurrency)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="pb-stagger flex flex-col gap-2.5 lg:gap-3">
                      {group.budgets.map((budget: IBudget, index) => (
                        <div key={budget._id} style={{ ["--i" as string]: groupIndex < 3 ? index : 0 }}>
                          <TransactionCard budget={budget} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <DashboardInsights
          budgets={filteredBudgets}
          currency={preferredCurrency}
          duration={duration}
          year={parseInt(year, 10)}
          month={parseInt(month, 10)}
          calendar={calendarType}
        />
      </div>
    </div>
  );
}
