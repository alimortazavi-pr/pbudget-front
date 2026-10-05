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
import { getJalaliDaysInMonth } from "@/common/utils/jalali-date";
import { formatBudgetDate, getNowDateParts } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { resolveBudgetCurrency, resolveBudgetDateCalendar, type UserCurrency } from "@/common/constants/user-preferences";
import { BudgetType } from "@/types/enums";
import moment from "moment-jalali";
import { showToast } from "@/common/utils/toast";
import { BudgetExportModal } from "@/components/pages/dashboard/BudgetExportModal";
import { DashboardInsights, DashboardKpis, DashboardPeriodBar } from "@/components/pages/dashboard/DashboardOverview";
import {
  ActiveFilterChips,
  TransactionFilterModal,
  TransactionSearchBar,
} from "@/components/pages/dashboard/TransactionFilters";
import {
  FILTER_KEYS,
  applyTransactionFilters,
  countActiveFilters,
  readFilters,
  sumByType,
} from "@/common/utils/transaction-filters";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { DashboardHero } from "@/components/pages/dashboard/DashboardHero";
import { WorkTimeQuickWidget } from "@/components/pages/projects/WorkTimeQuickWidget";
import { HmiDashboardPage } from "@/components/pages/dashboard/HmiDashboardPage";
import { TransactionCard } from "@/components/pages/dashboard/TransactionCard";
import { TransactionPagination } from "@/components/pages/dashboard/TransactionPagination";
import { displayAmountToToman, shouldConvertToman } from "@/common/utils/money-display";
import { TransactionListSkeleton } from "@/components/pages/dashboard/TransactionListSkeleton";
import * as cardsApi from "@/common/api/payment-cards";
import * as projectsApi from "@/common/api/projects";
import type { IBudget, IBudgetsSummary } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { IProject } from "@/common/interfaces/project.interface";
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
  const rawDuration = hydrated ? get("duration", "monthly") : "monthly";
  const duration = ["monthly", "daily", "yearly", "all"].includes(rawDuration) ? rawDuration : "monthly";
  const year = hydrated ? get("year", nowParts.year) : nowParts.year;
  const month = hydrated ? get("month", nowParts.month) : nowParts.month;
  const day = hydrated ? get("day", nowParts.day) : nowParts.day;
  const category = hydrated ? get("category", "") : "";
  const filters = readFilters(get);
  const filtersKey = FILTER_KEYS.map((key) => filters[key]).join("|");
  // A custom date range looks across every period.
  const hasRange = Boolean(filters.from || filters.to);
  const fetchDuration = hasRange ? "all" : duration;
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const { displayCurrencyLabel } = useCurrencyLabels();
  const paginated = appMode === "advanced";
  const page = Math.max(1, parseInt(hydrated ? get("page", "1") : "1", 10) || 1);
  const [pageSize, setPageSize] = useState(30);
  const [serverMeta, setServerMeta] = useState<{
    pagination: NonNullable<IBudgetsSummary["pagination"]>;
    dayTotals: NonNullable<IBudgetsSummary["dayTotals"]>;
    insights: NonNullable<IBudgetsSummary["insights"]>;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);
  const preferredCurrency = resolveBudgetCurrency(user?.preferences?.currency);

  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem("pb-page-size"));
      if ([20, 30, 50, 100].includes(stored)) setPageSize(stored);
    } catch {
      /* private mode */
    }
  }, []);

  /** Filter params as the server understands them (amounts in toman). */
  const toBaseAmount = (value: string) => {
    if (!value) return "";
    const n = Number(value.replace(/[,\s]/g, ""));
    if (!Number.isFinite(n)) return "";
    return String(shouldConvertToman(preferredCurrency) ? displayAmountToToman(n) : n);
  };
  const filterParams: Record<string, string> = {};
  if (filters.q) filterParams.q = filters.q;
  if (filters.type) filterParams.type = filters.type;
  if (filters.min) filterParams.min = toBaseAmount(filters.min);
  if (filters.max) filterParams.max = toBaseAmount(filters.max);
  if (filters.card) filterParams.card = filters.card;
  if (filters.project) filterParams.project = filters.project;
  if (filters.flags) filterParams.flags = filters.flags;
  if (filters.from) filterParams.from = filters.from;
  if (filters.to) filterParams.to = filters.to;
  if (filters.sort) filterParams.sort = filters.sort;
  const filterParamsKey = JSON.stringify(filterParams);

  const queryParams = new URLSearchParams();
  queryParams.set("duration", fetchDuration);
  if (fetchDuration !== "all") queryParams.set("year", year);
  if (fetchDuration === "monthly" || fetchDuration === "daily") queryParams.set("month", month);
  if (fetchDuration === "daily") queryParams.set("day", day);
  if (category) queryParams.set("category", category);
  if (paginated) {
    queryParams.set("limit", String(pageSize));
    queryParams.set("page", String(page));
    Object.entries(filterParams).forEach(([key, value]) => queryParams.set(key, value));
  }
  const queryString = queryParams.toString();

  const updateQuery = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      // Any change other than paging itself starts again from page 1.
      if (!("page" in patch)) params.delete("page");
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
    // Wait for the URL (period + filters) — otherwise a default-period request is wasted.
    if (!hydrated) return;
    let cancelled = false;
    async function load() {
      if (!hasLoadedOnce.current) setLoading(true);
      else setRefreshing(true);
      try {
        const data = await budgetsApi.fetchBudgets(
          Object.fromEntries(new URLSearchParams(queryString)),
        );
        if (!cancelled) {
          dispatch(setBudgets(data));
          setServerMeta(
            data.pagination
              ? { pagination: data.pagination, dayTotals: data.dayTotals ?? [], insights: data.insights ?? { totalCost: 0, categories: [], days: [] } }
              : null,
          );
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
          setRefreshing(false);
          hasLoadedOnce.current = true;
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, dispatch, queryString, budgetRevision, t]);

  // Labels for the active-filter chips (cheap, once).
  useEffect(() => {
    if (!hydrated || appMode !== "advanced") return;
    void cardsApi.fetchPaymentCards().then(setCards).catch(() => undefined);
    void projectsApi.fetchProjects().then(setProjects).catch(() => undefined);
  }, [hydrated, appMode]);

  const filterCount = countActiveFilters(filters, category);
  const clientFilterCount = countActiveFilters(filters, "");
  // Newer backend: filtering, totals and paging all happen on the server.
  // Older backend (no `pagination` in the reply): filter the loaded period here.
  const serverMode = serverMeta !== null;
  const filteredBudgets = useMemo(
    () => (serverMode ? (budgets ?? []) : applyTransactionFilters(budgets ?? [], filters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtersKey covers every filter field
    [budgets, serverMode, filtersKey],
  );
  const shownTotals = useMemo(
    () =>
      !serverMode && clientFilterCount
        ? sumByType(filteredBudgets, preferredCurrency)
        : { income: totalIncome ?? 0, cost: totalCost ?? 0 },
    [serverMode, clientFilterCount, filteredBudgets, preferredCurrency, totalIncome, totalCost],
  );
  const resultTotal = serverMeta ? serverMeta.pagination.total : filteredBudgets.length;
  // Daily spending line in the wallet card (monthly view only).
  const trend = useMemo(() => {
    if (duration !== "monthly") return [];
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!y || !m) return [];
    const count = calendarType === "gregorian" ? new Date(y, m, 0).getDate() : getJalaliDaysInMonth(y, m);
    const costs = Array.from({ length: count }, () => 0);
    if (serverMeta) {
      for (const row of serverMeta.insights.days) if (row.day >= 1 && row.day <= count) costs[row.day - 1] += row.cost;
    } else {
      for (const budget of filteredBudgets) {
        const d = Number(budget.day);
        if (budget.type === BudgetType.COST && resolveBudgetCurrency(budget.currency) === preferredCurrency && d >= 1 && d <= count) {
          costs[d - 1] += budget.price;
        }
      }
    }
    return costs;
  }, [duration, year, month, calendarType, serverMeta, filteredBudgets, preferredCurrency]);
  const dayTotalMap = useMemo(() => {
    const map = new Map<string, { income: number; cost: number }>();
    for (const row of serverMeta?.dayTotals ?? []) map.set(`${row.year}-${row.month}-${row.day}`, row);
    return map;
  }, [serverMeta]);

  // Group by transaction day so a month reads like a statement.
  const dayGroups = useMemo(() => {
    const groups: { key: string; budgets: IBudget[]; income: number; cost: number }[] = [];
    const byAmount = filters.sort === "highest" || filters.sort === "lowest";
    for (const budget of filteredBudgets) {
      const key = byAmount ? "sorted" : `${budget.year}-${budget.month}-${budget.day}`;
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
    // A day can continue on the next page: show its real total, not this page's share.
    for (const group of groups) {
      const real = dayTotalMap.get(group.key);
      if (real) {
        group.income = real.income;
        group.cost = real.cost;
      }
    }
    return groups;
  }, [filteredBudgets, user?.preferences?.currency, filters.sort, dayTotalMap]);

  /** Year/month/day of the period `delta` steps away (month or day). */
  const shiftedParts = useCallback(
    (delta: number, unit: "month" | "day" | "year") => {
      if (unit === "year") return { year: String(parseInt(year, 10) + delta), month, day };
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

  function shiftYear(delta: number) {
    updateQuery(shiftedParts(delta, "year"));
  }

  function shiftDay(delta: number) {
    updateQuery(shiftedParts(delta, "day"));
  }

  // Same-length previous period, for the "vs last period" deltas on the KPIs.
  const [previousTotals, setPreviousTotals] = useState<{ income: number; cost: number } | null>(null);
  useEffect(() => {
    if (!hydrated || appMode !== "advanced") return;
    let cancelled = false;
    if (duration === "all" || hasRange || (!serverMode && clientFilterCount)) {
      setPreviousTotals(null);
      return;
    }
    const prev = shiftedParts(-1, duration === "daily" ? "day" : duration === "yearly" ? "year" : "month");
    const params: Record<string, string> = { duration, year: prev.year };
    if (duration === "monthly" || duration === "daily") params.month = prev.month;
    if (duration === "daily") params.day = prev.day;
    if (category) params.category = category;
    // Newer backend: compare like with like (same filters) and fetch totals only.
    if (serverMode) Object.assign(params, JSON.parse(filterParamsKey), { limit: "1" });
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
  }, [hydrated, appMode, duration, category, clientFilterCount, hasRange, serverMode, filterParamsKey, shiftedParts, budgetRevision]);

  const isCurrentPeriod =
    String(year) === String(nowParts.year) &&
    (duration === "yearly" || String(month) === String(nowParts.month)) &&
    (duration !== "daily" || String(day) === String(nowParts.day));

  function setDuration(nextDuration: "monthly" | "daily" | "yearly" | "all") {
    if (nextDuration === duration) return;
    const keep = { year, month, day: "" };
    if (nextDuration === "daily") updateQuery({ duration: "daily", year, month, day });
    else if (nextDuration === "all") updateQuery({ duration: "all", from: "", to: "" });
    else updateQuery({ duration: nextDuration, ...keep });
  }

  const periodLabel = hasRange
    ? t("dashboard.customRange")
    : duration === "all"
      ? t("dashboard.allTimeLabel")
      : duration === "yearly"
        ? t("dashboard.yearLabel", { year: formatCount(parseInt(year, 10)).replace(/[,٬،]/g, "") })
        : duration === "daily"
          ? formatDayMonthYear(parseInt(day, 10), parseInt(month, 10), year, calendarType === "gregorian" ? "gregorian" : "jalali")
          : formatMonthYear(parseInt(month, 10), year, calendarType === "gregorian" ? "gregorian" : "jalali");

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

  return (
    <div className="pb-dashboard-page">
      <DashboardHero
        firstName={user?.firstName}
        income={shownTotals.income}
        expense={shownTotals.cost}
        trend={trend}
        data-tour="dashboard-balance"
      />

      <DashboardPeriodBar
        duration={hasRange ? "all" : duration}
        periodLabel={periodLabel}
        onDuration={(next) => {
          if (hasRange) updateQuery({ from: "", to: "" });
          setDuration(next);
        }}
        hideNav={duration === "all" || hasRange}
        onPrev={() => (duration === "daily" ? shiftDay(-1) : duration === "yearly" ? shiftYear(-1) : shiftMonth(-1))}
        onNext={() => (duration === "daily" ? shiftDay(1) : duration === "yearly" ? shiftYear(1) : shiftMonth(1))}
        onToday={() => updateQuery({ ...getNowDateParts(calendarType) })}
        isCurrentPeriod={isCurrentPeriod || duration === "all" || hasRange}
        onExport={() => setExportOpen(true)}
        filter={
          <TransactionSearchBar
            filters={filters}
            category={category}
            onChange={updateQuery}
            onOpenAdvanced={() => setFilterModalOpen(true)}
          />
        }
      />

      <TransactionFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        categories={categories ?? []}
        category={category}
        filters={filters}
        onApply={updateQuery}
      />

      <ActiveFilterChips
        filters={{ ...filters, q: "" }}
        category={category}
        categories={categories ?? []}
        cards={cards}
        projects={projects}
        unit={displayCurrencyLabel(preferredCurrency)}
        resultCount={resultTotal}
        onChange={updateQuery}
        onClear={() =>
          updateQuery({ category: "", q: "", ...Object.fromEntries(FILTER_KEYS.map((key) => [key, ""])) })
        }
      />

      <DashboardKpis
        current={shownTotals}
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
            {resultTotal ? (
              <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-muted">
                {t("dashboard.transactionCountInRange", { count: formatCount(resultTotal) })}
              </span>
            ) : null}
          </div>
          <div ref={listTopRef} className="-mt-3 scroll-mt-24" aria-hidden />

          {loading ? (
            <TransactionListSkeleton />
          ) : filteredBudgets.length === 0 ? (
            <div className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-12 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Filter size={26} variant="Bulk" />
              </span>
              <p className="font-bold">{t(filterCount ? "dashboard.noMatch" : "dashboard.noTransactionsFound")}</p>
              <p className="mt-1 max-w-xs text-sm text-muted">{t(filterCount ? "dashboard.noMatchHint" : "dashboard.noTransactionsInRange")}</p>
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
            <div className={`flex flex-col gap-5 transition-opacity duration-200 ${refreshing ? "pointer-events-none opacity-50" : ""}`} data-tour="dashboard-transactions">
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
              {serverMeta ? (
                <TransactionPagination
                  page={serverMeta.pagination.page}
                  pages={serverMeta.pagination.pages}
                  total={serverMeta.pagination.total}
                  limit={serverMeta.pagination.limit}
                  busy={refreshing}
                  onPage={(next) => {
                    updateQuery({ page: next > 1 ? String(next) : "" });
                    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onLimit={(next) => {
                    setPageSize(next);
                    try {
                      window.localStorage.setItem("pb-page-size", String(next));
                    } catch {
                      /* private mode */
                    }
                    updateQuery({ page: "" });
                  }}
                />
              ) : null}
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
          server={serverMeta?.insights ?? null}
        />
      </div>
    </div>
  );
}
