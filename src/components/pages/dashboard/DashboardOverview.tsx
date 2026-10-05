"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ArrowDown, ArrowLeft2, ArrowRight2, ArrowUp, Chart21, Export, PercentageSquare, Wallet3 } from "iconsax-reactjs";

import type { IBudget } from "@/common/interfaces/budget.interface";
import { resolveBudgetCurrency, type UserCurrency } from "@/common/constants/user-preferences";
import { getJalaliDaysInMonth } from "@/common/utils/jalali-date";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { formatAmountOnly, formatCompactAmount, formatPriceWithCurrency } from "@/common/utils/format-currency";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { OverflowReveal } from "@/components/common/ui/OverflowReveal";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { BudgetType } from "@/types/enums";

/* ------------------------------------------------------------------ period bar */

type PeriodBarProps = {
  duration: string;
  periodLabel: string;
  onDuration: (value: "monthly" | "daily" | "yearly" | "all") => void;
  /** Hide the period arrows (e.g. "all time" or a custom date range). */
  hideNav?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentPeriod: boolean;
  onExport?: () => void;
  filter: ReactNode;
};

/** One sticky bar for everything that scopes the dashboard (was three cards). */
export function DashboardPeriodBar(props: PeriodBarProps) {
  const { t } = useTranslation();
  const options = [
    { id: "monthly" as const, label: t("common.monthly") },
    { id: "daily" as const, label: t("common.daily") },
    { id: "yearly" as const, label: t("common.yearly") },
    { id: "all" as const, label: t("dashboard.allTime") },
  ];
  const activeIndex = Math.max(0, options.findIndex((option) => option.id === props.duration));

  return (
    <div className="pb-period-bar" data-tour="dashboard-period">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex flex-col gap-2 lg:contents">
        <div className="pb-segmented w-full lg:w-auto" style={{ ["--n" as string]: options.length, ["--a" as string]: activeIndex }} role="tablist" aria-label={t("dashboard.periodType")}>
          <span className="pb-segmented-thumb" aria-hidden />
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={props.duration === option.id}
              onClick={() => props.onDuration(option.id)}
              className="pb-segmented-item"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-between gap-1 rounded-xl bg-surface-secondary/70 px-1 py-1 lg:max-w-sm">
          <button type="button" className="pb-icon-btn disabled:opacity-30" disabled={props.hideNav} onClick={props.onPrev} aria-label={t("dashboard.previousPeriod")}>
            <ArrowRight2 size={18} />
          </button>
          <div className="flex min-w-0 flex-col items-center leading-tight">
            <span key={props.periodLabel} className="pb-pop truncate text-sm font-bold lg:text-base">
              {props.periodLabel}
            </span>
            {!props.isCurrentPeriod ? (
              <button type="button" onClick={props.onToday} className="text-[11px] font-medium text-accent hover:underline">
                {t("common.goToToday")}
              </button>
            ) : null}
          </div>
          <button type="button" className="pb-icon-btn disabled:opacity-30" disabled={props.hideNav} onClick={props.onNext} aria-label={t("dashboard.nextPeriod")}>
            <ArrowLeft2 size={18} />
          </button>
        </div>
        </div>

        <div className="flex items-end gap-2 lg:contents">
          <div className="min-w-0 flex-1 lg:w-72 lg:flex-none" data-tour="dashboard-filter">
            {props.filter}
          </div>
          {props.onExport ? (
            <button type="button" onClick={props.onExport} className="pb-press pb-ghost-btn mb-0.5 h-11" aria-label={t("common.export")}>
              <Export size={17} />
              <span className="hidden sm:inline">{t("common.export")}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- KPIs */

type Totals = { income: number; cost: number };

function changePercent(current: number, previous: number | undefined) {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function Delta({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  if (value === null) return <span className="text-[11px] text-muted">{t("dashboard.noPreviousPeriod")}</span>;
  if (value === 0) return <span className="text-[11px] text-muted">{t("dashboard.sameAsPrevious")}</span>;
  const up = value > 0;
  const good = up === goodWhenUp;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
        good ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
      }`}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {formatCount(Math.abs(value))}٪
      <span className="font-normal opacity-80"> {t("dashboard.vsPrevious")}</span>
    </span>
  );
}

export function DashboardKpis({
  current,
  previous,
  count,
  currency,
}: {
  current: Totals;
  previous: Totals | null;
  count: number;
  currency: UserCurrency;
}) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const unit = displayCurrencyLabel(currency);
  const fullAmount = (n: number) => formatAmountOnly(n, currency);
  const amount = (n: number) => formatCompactAmount(n, currency);
  const net = current.income - current.cost;
  const prevNet = previous ? previous.income - previous.cost : undefined;
  const savingsRate = current.income > 0 ? Math.round((net / current.income) * 100) : null;

  const cards = [
    {
      id: "income",
      label: t("dashboard.periodIncome"),
      icon: ArrowDown,
      tone: "teal",
      value: current.income,
      format: amount,
      unit,
      delta: <Delta value={changePercent(current.income, previous?.income)} goodWhenUp />,
    },
    {
      id: "cost",
      label: t("dashboard.periodExpense"),
      icon: ArrowUp,
      tone: "rose",
      value: current.cost,
      format: amount,
      unit,
      delta: <Delta value={changePercent(current.cost, previous?.cost)} goodWhenUp={false} />,
    },
    {
      id: "net",
      label: t("dashboard.periodBalance"),
      icon: Wallet3,
      tone: "violet",
      value: net,
      format: (n: number) => `${n < 0 ? "−" : ""}${amount(Math.abs(n))}`,
      full: (n: number) => `${n < 0 ? "−" : ""}${fullAmount(Math.abs(n))}`,
      unit,
      delta:
        prevNet !== undefined && prevNet !== 0 ? (
          <Delta value={Math.round(((net - prevNet) / Math.abs(prevNet)) * 100)} goodWhenUp />
        ) : (
          <span className="text-[11px] text-muted">{t("dashboard.transactionCountInRange", { count: formatCount(count) })}</span>
        ),
    },
    {
      id: "rate",
      label: t("dashboard.savingsRate"),
      icon: PercentageSquare,
      tone: "amber",
      value: savingsRate ?? 0,
      format: (n: number) => (savingsRate === null ? "—" : `${formatCount(n)}٪`),
      unit: "",
      delta: (
        <span className="text-[11px] text-muted">
          {savingsRate === null
            ? t("dashboard.savingsRateNoIncome")
            : savingsRate >= 20
              ? t("dashboard.savingsRateGood")
              : savingsRate >= 0
                ? t("dashboard.savingsRateLow")
                : t("dashboard.savingsRateNegative")}
        </span>
      ),
    },
  ];

  return (
    <div className="pb-stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <article key={card.id} className="pb-kpi pb-lift" data-tone={card.tone} style={{ ["--i" as string]: index }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted lg:text-sm">{card.label}</span>
              <span className="pb-kpi-icon">
                <Icon size={16} variant="Bold" />
              </span>
            </div>
            <p className="mt-2 flex min-w-0 items-baseline gap-1">
              <OverflowReveal full={`${("full" in card && card.full ? card.full : fullAmount)(card.value)} ${card.unit}`.trim()} className="truncate">
                <AnimatedNumber
                  value={card.value}
                  format={card.format}
                  className="text-[1.05rem] font-extrabold tracking-tight sm:text-lg lg:text-2xl"
                />
              </OverflowReveal>
              {card.unit ? <span className="shrink-0 text-[11px] font-medium text-muted lg:text-xs">{card.unit}</span> : null}
            </p>
            <div className="mt-1.5 min-h-5">{card.delta}</div>
          </article>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- insights */

type InsightsProps = {
  budgets: IBudget[];
  currency: UserCurrency;
  duration: string;
  year: number;
  month: number;
  calendar: string;
  /** Totals computed by the server over the whole filtered set (paginated mode). */
  server?: {
    totalCost: number;
    categories: { categoryId: string | null; title: string | null; color: string | null; amount: number }[];
    days: { year: number; month: number; day: number; cost: number }[];
  } | null;
};

/** "This period at a glance": where the money went and how spending moved by day. */
export function DashboardInsights({ budgets, currency, duration, year, month, calendar, server }: InsightsProps) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();

  const own = useMemo(
    () => budgets.filter((budget) => resolveBudgetCurrency(budget.currency) === currency),
    [budgets, currency],
  );

  const categories = useMemo(() => {
    if (server) {
      const rows = server.categories.map((row, index) => ({
        title: row.title ?? t("dashboard.uncategorized"),
        color: resolveCategoryColor(row.color, row.categoryId ?? `none-${index}`),
        amount: row.amount,
      }));
      const top = rows.slice(0, 5);
      return { rows: top, others: Math.max(0, server.totalCost - top.reduce((sum, row) => sum + row.amount, 0)), total: server.totalCost };
    }
    const map = new Map<string, { title: string; color: string; amount: number }>();
    let total = 0;
    for (const budget of own) {
      if (budget.type !== BudgetType.COST) continue;
      const category = typeof budget.category === "object" && budget.category ? budget.category : null;
      const key = category?._id ?? "none";
      const row = map.get(key) ?? {
        title: category?.title ?? t("dashboard.uncategorized"),
        color: resolveCategoryColor(category?.color, category?._id ?? key),
        amount: 0,
      };
      row.amount += budget.price;
      total += budget.price;
      map.set(key, row);
    }
    const rows = [...map.values()].sort((a, b) => b.amount - a.amount);
    return { rows: rows.slice(0, 5), others: rows.slice(5).reduce((s, r) => s + r.amount, 0), total };
  }, [own, server, t]);

  const days = useMemo(() => {
    if (duration !== "monthly") return null;
    const count =
      calendar === "gregorian" ? new Date(year, month, 0).getDate() : getJalaliDaysInMonth(year, month);
    const costs = Array.from({ length: count }, () => 0);
    if (server) {
      for (const row of server.days) {
        if (row.day >= 1 && row.day <= count) costs[row.day - 1] += row.cost;
      }
    } else {
      for (const budget of own) {
        const day = Number(budget.day);
        if (budget.type === BudgetType.COST && day >= 1 && day <= count) costs[day - 1] += budget.price;
      }
    }
    const max = Math.max(...costs, 1);
    const activeDays = costs.filter((c) => c > 0).length;
    const peak = costs.indexOf(Math.max(...costs));
    return { costs, max, activeDays, peak, total: costs.reduce((a, b) => a + b, 0) };
  }, [own, server, duration, calendar, year, month]);

  const money = (n: number) => formatPriceWithCurrency(n, currency);

  return (
    <aside className="flex flex-col gap-4">
      <section className="pb-panel">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Chart21 size={18} className="text-accent" variant="Bulk" />
            {t("dashboard.whereMoneyWent")}
          </h3>
          {categories.total > 0 ? <span className="text-xs text-muted">{money(categories.total)}</span> : null}
        </header>
        {categories.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t("dashboard.noExpenseInPeriod")}</p>
        ) : (
          <ul className="pb-stagger space-y-3">
            {categories.rows.map((row, index) => {
              const share = categories.total ? (row.amount / categories.total) * 100 : 0;
              return (
                <li key={row.title + index} style={{ ["--i" as string]: index }}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
                      <span className="truncate font-medium">{row.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatCount(Math.round(share))}٪ · {money(row.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="pb-meter-fill h-full rounded-full"
                      style={{ width: `${Math.max(share, 2)}%`, background: row.color, ["--i" as string]: index }}
                    />
                  </div>
                </li>
              );
            })}
            {categories.others > 0 ? (
              <li className="text-xs text-muted" style={{ ["--i" as string]: 6 }}>
                {t("dashboard.otherCategories", { amount: money(categories.others) })}
              </li>
            ) : null}
          </ul>
        )}
      </section>

      {days ? (
        <section className="pb-panel">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold">{t("dashboard.dailySpending")}</h3>
            {days.total > 0 ? (
              <span className="text-xs text-muted">
                {t("dashboard.dailyAverage", { amount: money(Math.round(days.total / Math.max(days.activeDays, 1))) })}
              </span>
            ) : null}
          </header>
          <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={t("dashboard.dailySpending")}>
            {days.costs.map((cost, index) => (
              <div key={index} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`pb-bar-grow w-full rounded-t-[4px] ${
                    index === days.peak && cost > 0 ? "bg-[var(--brand-rose)]" : "bg-[color-mix(in_oklch,var(--brand-violet)_55%,transparent)]"
                  }`}
                  style={{ height: cost > 0 ? `${Math.max((cost / days.max) * 100, 6)}%` : "3px", opacity: cost > 0 ? 1 : 0.35, ["--i" as string]: index }}
                />
                {cost > 0 ? (
                  <span className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] text-background shadow-lg group-hover:block">
                    {formatCount(index + 1)} · {money(cost)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted">
            <span>{formatCount(1)}</span>
            <span>{formatCount(Math.ceil(days.costs.length / 2))}</span>
            <span>{formatCount(days.costs.length)}</span>
          </div>
          {days.total > 0 ? (
            <p className="mt-3 rounded-xl bg-surface-secondary/70 px-3 py-2 text-xs leading-6 text-muted">
              {t("dashboard.peakDay", { day: formatCount(days.peak + 1), amount: money(days.costs[days.peak]) })}
            </p>
          ) : null}
        </section>
      ) : null}
    </aside>
  );
}
