"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Chart21, Crown } from "iconsax-reactjs";

import * as analyticsApi from "@/common/api/analytics";
import type { CategoryTotals } from "@/common/api/analytics";
import { PATHS } from "@/common/constants";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { DEFAULT_USER_PREFERENCES, resolveBudgetCurrency } from "@/common/constants/user-preferences";
import type { AnalyticsDuration } from "@/common/interfaces/analytics.interface";
import { getNowDateParts } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { shiftPeriod } from "@/common/utils/period-shift";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { DashboardPeriodBar } from "@/components/pages/dashboard/DashboardOverview";
import { useTranslation } from "@/i18n";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

/**
 * The free part of financial analysis: how much went to each category in a
 * day, month, year or all time. The full report stays on paid plans.
 */
export function CategoryTotalsPage() {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const calendar = user?.preferences?.dateCalendar ?? "jalali";
  const currency = resolveBudgetCurrency(user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency);
  const { formatMonthYear, formatDayMonthYear, formatCount } = useLocalizedDate();
  const now = getNowDateParts(calendar);

  const [duration, setDuration] = useState<AnalyticsDuration>("monthly");
  const [parts, setParts] = useState({ year: now.year, month: now.month, day: now.day });
  const [view, setView] = useState<"cost" | "income">("cost");
  const [data, setData] = useState<CategoryTotals | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    analyticsApi
      .fetchCategoryTotals({ duration, ...parts })
      .then((result) => alive && setData(result))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [duration, parts, reloadKey]);

  const unit = duration === "daily" ? "day" : duration === "yearly" ? "year" : "month";
  const kind = calendar === "gregorian" ? "gregorian" : "jalali";
  const periodLabel =
    duration === "all"
      ? t("dashboard.allTimeLabel")
      : duration === "yearly"
        ? t("dashboard.yearLabel", { year: formatCount(parseInt(parts.year, 10)).replace(/[,٬،]/g, "") })
        : duration === "daily"
          ? formatDayMonthYear(parseInt(parts.day, 10), parseInt(parts.month, 10), parts.year, kind)
          : formatMonthYear(parseInt(parts.month, 10), parts.year, kind);
  const isCurrent =
    duration === "all" ||
    (String(parts.year) === String(now.year) &&
      (duration === "yearly" || String(parts.month) === String(now.month)) &&
      (duration !== "daily" || String(parts.day) === String(now.day)));

  const rows = (data?.categories ?? [])
    .filter((item) => (view === "cost" ? item.cost : item.income) > 0)
    .sort((a, b) => (view === "cost" ? b.cost - a.cost : b.income - a.income));
  const total = view === "cost" ? data?.totalCost ?? 0 : data?.totalIncome ?? 0;
  const top = rows.length ? (view === "cost" ? rows[0].cost : rows[0].income) : 0;

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={<Chart21 size={24} variant="Bold" />}
        title="جمع هر دسته‌بندی"
        description="ببینید در هر بازه چقدر خرج (یا درآمد) هر دسته‌بندی بوده است."
      />

      <DashboardPeriodBar
        duration={duration}
        periodLabel={periodLabel}
        onDuration={(next) => setDuration(next)}
        hideNav={duration === "all"}
        onPrev={() => setParts((current) => ({ ...current, ...shiftPeriod(calendar, current, -1, unit) }))}
        onNext={() => setParts((current) => ({ ...current, ...shiftPeriod(calendar, current, 1, unit) }))}
        onToday={() => setParts(getNowDateParts(calendar))}
        isCurrentPeriod={isCurrent}
        filter={
          <div className="pb-segmented h-11 w-full" style={{ ["--n" as string]: 2, ["--a" as string]: view === "cost" ? 0 : 1 }} role="tablist" aria-label="نوع">
            <span className="pb-segmented-thumb" aria-hidden />
            <button type="button" role="tab" aria-selected={view === "cost"} className="pb-segmented-item" onClick={() => setView("cost")}>
              هزینه‌ها
            </button>
            <button type="button" role="tab" aria-selected={view === "income"} className="pb-segmented-item" onClick={() => setView("income")}>
              درآمدها
            </button>
          </div>
        }
      />

      <section className="glass rounded-2xl p-4" data-testid="category-totals">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">{view === "cost" ? "جمع هزینه‌ها" : "جمع درآمدها"}</h2>
          <span className={`text-base font-extrabold tabular-nums ${view === "cost" ? "text-expense" : "text-income"}`}>
            {formatPriceWithCurrency(total, currency)}
          </span>
        </div>

        {failed ? (
          <div className="py-6 text-center text-sm">
            <p className="text-muted">بارگذاری ممکن نشد.</p>
            <Button size="sm" variant="secondary" className="mt-3" onPress={() => setReloadKey((value) => value + 1)}>
              تلاش دوباره
            </Button>
          </div>
        ) : !data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="pb-shimmer h-11 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            در این بازه {view === "cost" ? "هزینه‌ای" : "درآمدی"} ثبت نشده است.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((item) => {
              const amount = view === "cost" ? item.cost : item.income;
              const share = view === "cost" ? item.shareOfCost : item.shareOfIncome;
              const color = resolveCategoryColor(item.color, item.categoryId);
              return (
                <li key={item.categoryId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                      <span className="truncate font-medium">
                        {item.parentTitle ? <span className="text-muted">{item.parentTitle} / </span> : null}
                        {item.title}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatPriceWithCurrency(amount, currency)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                      <div className="h-full rounded-full" style={{ width: `${top > 0 ? Math.max(2, (amount / top) * 100) : 0}%`, background: color }} />
                    </div>
                    <span className="w-24 shrink-0 text-end text-[11px] text-muted">
                      {toPersianDigits(Math.round(share))}٪ · {toPersianDigits(item.count)} تراکنش
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href={PATHS.PLANS}
        className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3 text-sm transition hover:bg-accent/12"
      >
        <Crown size={20} variant="Bold" className="shrink-0 text-warning" />
        <span className="min-w-0">
          <span className="block font-semibold">تحلیل مالی کامل</span>
          <span className="block text-xs leading-5 text-muted">نمودارها، مقایسه با دورهٔ قبل، سقف بودجه، حساب‌ها و پیشنهادهای هوشمند در پلن‌های بالاتر.</span>
        </span>
        <span className="ms-auto shrink-0 text-xs font-semibold text-accent">مشاهدهٔ پلن‌ها</span>
      </Link>
    </div>
  );
}
