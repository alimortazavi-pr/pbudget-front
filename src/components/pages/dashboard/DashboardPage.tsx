"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft2, ArrowRight2, Export, Filter } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { getJalaliNow, JALALI_MONTHS, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { BudgetExportModal } from "@/components/pages/dashboard/BudgetExportModal";
import { BudgetStats } from "@/components/pages/dashboard/BudgetStats";
import { DashboardFilterSection } from "@/components/pages/dashboard/DashboardFilterSection";
import { DashboardHero } from "@/components/pages/dashboard/DashboardHero";
import { WorkTimeQuickWidget } from "@/components/pages/projects/WorkTimeQuickWidget";
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
import { userSelector } from "@/stores/profile";

type DashboardPageProps = {
  initialData?: IBudgetsSummary;
};

export function DashboardPage({ initialData }: DashboardPageProps) {
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

  const now = getJalaliNow();
  const duration = hydrated ? get("duration", "monthly") : "monthly";
  const year = hydrated ? get("year", String(now.jYear())) : String(now.jYear());
  const month = hydrated ? get("month", String(now.jMonth() + 1)) : String(now.jMonth() + 1);
  const day = hydrated ? get("day", String(now.jDate())) : String(now.jDate());
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
      router.replace(`/?${params.toString()}`, { scroll: false });
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
          err instanceof Error ? err.message : "خطا در دریافت تراکنش‌ها",
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

  function shiftDay(delta: number) {
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

  return (
    <div className="pb-dashboard-page">
      <DashboardHero
        firstName={user?.firstName}
        balance={user?.budget ?? 0}
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
            ماهانه
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
            روزانه
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
            {duration === "daily"
              ? `${toPersianDigits(day)} ${JALALI_MONTHS[parseInt(month, 10) - 1]} ${toPersianDigits(year)}`
              : `${JALALI_MONTHS[parseInt(month, 10) - 1]} ${toPersianDigits(year)}`}
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
        <h3 className="text-base font-semibold lg:text-lg">تراکنش‌ها</h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted"
          onPress={() => setExportOpen(true)}
        >
          <Export size={16} />
          خروجی
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
          <p className="font-medium">تراکنشی یافت نشد</p>
          <p className="mt-1 text-sm text-muted">
            برای این بازه زمانی هنوز ثبت نشده
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
