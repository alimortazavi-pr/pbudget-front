"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft2, ArrowRight2, Export, Filter } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import { PATHS } from "@/common/constants";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { getJalaliNow } from "@/common/utils";
import { getNowDateParts } from "@/common/utils/calendar-date";
import moment from "moment-jalali";
import { showToast } from "@/common/utils/toast";
import { BudgetExportModal } from "@/components/pages/dashboard/BudgetExportModal";
import { BudgetStats } from "@/components/pages/dashboard/BudgetStats";
import { DashboardFilterSection } from "@/components/pages/dashboard/DashboardFilterSection";
import { DashboardHero } from "@/components/pages/dashboard/DashboardHero";
import { WorkTimeQuickWidget } from "@/components/pages/projects/WorkTimeQuickWidget";
import { SimpleDashboardPanel } from "@/components/pages/dashboard/SimpleDashboardPanel";
import { SimpleTransactionCard } from "@/components/pages/dashboard/SimpleTransactionCard";
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
  const { isSimple } = useAppMode();
  const { formatMonthYear, formatDayMonthYear } = useLocalizedDate();
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
        if (!cancelled) dispatch(setBudgets(data));
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
  }, [dispatch, queryString, budgetRevision]);

  const filteredBudgets = budgets ?? [];

  function shiftMonth(delta: number) {
    if (calendarType === "gregorian") {
      const m = moment()
        .year(parseInt(year, 10))
        .month(parseInt(month, 10) - 1)
        .add(delta, "month");
      updateQuery({
        year: String(m.year()),
        month: String(m.month() + 1),
        day: String(m.date()),
      });
    } else {
      const m = getJalaliNow()
        .jYear(parseInt(year, 10))
        .jMonth(parseInt(month, 10) - 1)
        .add(delta, "jMonth");
      updateQuery({
        year: String(m.jYear()),
        month: String(m.jMonth() + 1),
        day: String(m.jDate()),
      });
    }
  }

  function shiftDay(delta: number) {
    if (calendarType === "gregorian") {
      const m = moment()
        .year(parseInt(year, 10))
        .month(parseInt(month, 10) - 1)
        .date(parseInt(day, 10))
        .add(delta, "day");
      updateQuery({
        year: String(m.year()),
        month: String(m.month() + 1),
        day: String(m.date()),
      });
    } else {
      const m = getJalaliNow()
        .jYear(parseInt(year, 10))
        .jMonth(parseInt(month, 10) - 1)
        .jDate(parseInt(day, 10))
        .add(delta, "day");
      updateQuery({
        year: String(m.jYear()),
        month: String(m.jMonth() + 1),
        day: String(m.jDate()),
      });
    }
  }

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

  if (isSimple) {
    return (
      <div className="pb-simple-dashboard">
        <SimpleDashboardPanel
          duration={duration}
          year={year}
          month={month}
          day={day}
          periodLabel={periodLabel}
          income={totalIncome ?? 0}
          expense={totalCost ?? 0}
          count={filteredBudgets.length}
          onDurationChange={setDuration}
          onShiftPeriod={(delta) =>
            duration === "daily" ? shiftDay(delta) : shiftMonth(delta)
          }
        />

        {loading ? (
          <TransactionListSkeleton />
        ) : filteredBudgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Filter size={32} className="mx-auto mb-3 text-muted" />
            <p className="font-medium">{t("dashboard.noTransactionsFound")}</p>
            <p className="mt-1 text-sm text-muted">
              {t("dashboard.noTransactionsInRange")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredBudgets.map((budget: IBudget) => (
              <SimpleTransactionCard key={budget._id} budget={budget} />
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="pb-dashboard-page">
      <DashboardHero
        firstName={user?.firstName}
        income={totalIncome ?? 0}
        expense={totalCost ?? 0}
        data-tour="dashboard-balance"
      />

      <div className="px-4 pb-4">
        <WorkTimeQuickWidget />
      </div>

      <BudgetStats
        count={filteredBudgets.length}
        periodBalance={(totalIncome ?? 0) - (totalCost ?? 0)}
      />

      <div className="pb-dashboard-toolbar" data-tour="dashboard-period">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuery({ duration: "monthly" })}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors lg:px-5 lg:py-2 ${
              duration === "monthly"
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {t("common.monthly")}
          </button>
          <button
            type="button"
            onClick={() => updateQuery({ duration: "daily" })}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors lg:px-5 lg:py-2 ${
              duration === "daily"
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {t("common.daily")}
          </button>
        </div>

        <div className="pb-dashboard-toolbar-nav">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => (duration === "daily" ? shiftDay(-1) : shiftMonth(-1))}
          >
            <ArrowRight2 size={18} />
          </Button>
          <p className="text-sm font-medium lg:text-base">
            {periodLabel}
          </p>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => (duration === "daily" ? shiftDay(1) : shiftMonth(1))}
          >
            <ArrowLeft2 size={18} />
          </Button>
        </div>
      </div>

      <div data-tour="dashboard-filter">
        <DashboardFilterSection
          categories={categories ?? []}
          category={category}
          year={year}
          month={month}
          day={day}
          onCategoryChange={(nextCategory) =>
            updateQuery({ category: nextCategory })
          }
          onApplyFilter={(patch) =>
            updateQuery({
              category: patch.category,
              year: patch.year,
              month: patch.month,
              day: patch.day,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between pt-1 lg:pt-2">
        <h3 className="text-base font-semibold lg:text-lg">
          {t("dashboard.transactions")}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted"
          onPress={() => setExportOpen(true)}
        >
          <Export size={16} />
          {t("common.export")}
        </Button>
      </div>

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

      {loading ? (
        <TransactionListSkeleton />
      ) : filteredBudgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center lg:p-12">
          <Filter size={32} className="mx-auto mb-3 text-muted" />
          <p className="font-medium">{t("dashboard.noTransactionsFound")}</p>
          <p className="mt-1 text-sm text-muted">
            {t("dashboard.noTransactionsInRange")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:gap-4" data-tour="dashboard-transactions">
          {filteredBudgets.map((budget: IBudget) => (
            <TransactionCard key={budget._id} budget={budget} />
          ))}
        </div>
      )}
    </div>
  );
}
