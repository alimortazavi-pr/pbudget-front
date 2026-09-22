"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AddCircle,
  ArrowLeft2,
  ArrowRight2,
  Book1,
  Briefcase,
  Calendar,
  Calendar1,
  Card,
  Chart2,
  Clock,
  Danger,
  DocumentText,
  MoneyAdd,
  MoneyRemove,
  MoneyRecive,
  Refresh2,
  Setting2,
  Wallet,
  Wallet3,
} from "iconsax-reactjs";
import moment from "moment-jalali";

import { useTranslation } from "@/components/providers/LanguageProvider";
import { LinkButton } from "@/components/common/ui/LinkButton";
import { PATHS } from "@/common/constants";
import type { AppMode } from "@/common/constants/app-mode";
import type { UserDateCalendar } from "@/common/constants/user-preferences";
import { fetchPersianCalendarYear, type PersianCalendarDay } from "@/common/api/persian-calendar";
import type { IProfile } from "@/common/interfaces/profile.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { getJalaliNow } from "@/common/utils";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { SimpleTransactionCard } from "./SimpleTransactionCard";
import { TransactionListSkeleton } from "./TransactionListSkeleton";

type HmiMode = Exclude<AppMode, "advanced">;

type HmiDashboardPageProps = {
  mode: HmiMode;
  user: IProfile | null;
  budgets: IBudget[];
  totalIncome: number;
  totalCost: number;
  loading: boolean;
  periodLabel: string;
  duration: string;
  year: string;
  month: string;
  day: string;
  calendarType: UserDateCalendar;
  onShiftMonth: (delta: number) => void;
  onShiftDay: (delta: number) => void;
  onDurationChange: (duration: "monthly" | "daily") => void;
  onSelectDate: (date: { year: string; month: string; day: string }) => void;
};

type PersianMonth = {
  year: number;
  month: number;
  selectedDay: number;
};

const WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

const holidayCache = new Map<number, PersianCalendarDay[]>();

function usePersianCalendar(year: number) {
  const [days, setDays] = useState<PersianCalendarDay[]>(
    () => holidayCache.get(year) ?? [],
  );
  const [loading, setLoading] = useState(!holidayCache.has(year));
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = holidayCache.get(year);
    if (cached) {
      setDays(cached);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    void fetchPersianCalendarYear(year)
      .then((nextDays) => {
        if (cancelled) return;
        holidayCache.set(year, nextDays);
        setDays(nextDays);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  return { days, loading, error };
}

function resolvePersianMonth(
  year: string,
  month: string,
  day: string,
  calendarType: UserDateCalendar,
): PersianMonth {
  if (calendarType === "jalali") {
    return {
      year: Number(year) || getJalaliNow().jYear(),
      month: Number(month) || getJalaliNow().jMonth() + 1,
      selectedDay: Number(day) || getJalaliNow().jDate(),
    };
  }

  const gregorianDate = moment(
    `${year}-${month}-${day}`,
    "YYYY-M-D",
  );
  return {
    year: gregorianDate.jYear(),
    month: gregorianDate.jMonth() + 1,
    selectedDay: gregorianDate.jDate(),
  };
}

function HmiAction({
  href,
  icon,
  title,
  subtitle,
  tone = "default",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone?: "default" | "income" | "expense";
}) {
  return (
    <Link
      href={href}
      className="pb-hmi-action"
      data-tone={tone}
    >
      <span className="pb-hmi-action-icon">{icon}</span>
      <span className="min-w-0">
        <span className="block text-base font-bold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{subtitle}</span>
      </span>
      <ArrowLeft2 className="ms-auto shrink-0 text-muted" size={20} />
    </Link>
  );
}

function HmiCalendarGrid({
  month,
  holidayDays,
  selectedKey,
  onSelectDay,
  variant,
}: {
  month: PersianMonth;
  holidayDays: PersianCalendarDay[];
  selectedKey: string;
  onSelectDay: (day: number) => void;
  variant: "calendar" | "notebook" | "compact";
}) {
  const holidayMap = useMemo(
    () => new Map(holidayDays.map((item) => [item.shamsiDate, item])),
    [holidayDays],
  );
  const cells = useMemo(() => {
    const first = getJalaliNow()
      .jYear(month.year)
      .jMonth(month.month - 1)
      .jDate(1);
    const next = first.clone().add(1, "jMonth");
    const totalDays = next.diff(first, "days");
    const offset = (first.day() + 1) % 7;
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [month]);
  const today = getJalaliNow();
  const todayKey = `${today.jYear()}/${String(today.jMonth() + 1).padStart(2, "0")}/${String(today.jDate()).padStart(2, "0")}`;

  return (
    <div className={`pb-hmi-calendar-grid pb-hmi-calendar-grid-${variant}`}>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="pb-hmi-weekday">
            {weekday.slice(0, variant === "compact" ? 1 : 3)}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
          const key = `${month.year}/${String(month.month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
          const holiday = holidayMap.get(key);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              className="pb-hmi-day"
              data-selected={isSelected ? "true" : "false"}
              data-holiday={holiday?.isHoliday ? "true" : "false"}
              data-today={isToday ? "true" : "false"}
              aria-label={`${toPersianDigits(String(day))}${holiday?.holidayDesription ? `، ${holiday.holidayDesription}` : ""}`}
              onClick={() => onSelectDay(day)}
            >
              <span>{toPersianDigits(String(day))}</span>
              {holiday?.isHoliday ? <i aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HmiCalendarStatus({
  holiday,
  loading,
  error,
}: {
  holiday?: PersianCalendarDay;
  loading: boolean;
  error: boolean;
}) {
  const { t } = useTranslation();
  if (holiday?.isHoliday) {
    return (
      <p className="pb-hmi-holiday" role="status">
        <Danger size={18} variant="Bold" />
        <span>{holiday.holidayDesription || t("common.hmiOfficialHoliday")}</span>
      </p>
    );
  }
  if (loading) {
    return <p className="text-xs text-muted">{t("common.hmiHolidayLoading")}</p>;
  }
  if (error) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted" role="status">
        <Refresh2 size={14} /> {t("common.hmiHolidayUnavailable")}
      </p>
    );
  }
  return <p className="text-xs text-muted">{t("common.hmiNotHoliday")}</p>;
}

function HmiPeriodControls({
  periodLabel,
  duration,
  onDurationChange,
  onShift,
}: {
  periodLabel: string;
  duration: string;
  onDurationChange: (duration: "monthly" | "daily") => void;
  onShift: (delta: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pb-hmi-period-controls">
      <div className="pb-hmi-toggle" role="group" aria-label={t("dashboard.timeRange")}>
        <button
          type="button"
          data-active={duration === "monthly" ? "true" : "false"}
          onClick={() => onDurationChange("monthly")}
        >
          {t("common.monthly")}
        </button>
        <button
          type="button"
          data-active={duration === "daily" ? "true" : "false"}
          onClick={() => onDurationChange("daily")}
        >
          {t("common.daily")}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="pb-hmi-nav-button" onClick={() => onShift(-1)}>
          <ArrowRight2 size={21} />
          <span className="sr-only">{t("common.hmiPrevious")}</span>
        </button>
        <strong className="text-center text-sm sm:text-base">{periodLabel}</strong>
        <button type="button" className="pb-hmi-nav-button" onClick={() => onShift(1)}>
          <ArrowLeft2 size={21} />
          <span className="sr-only">{t("common.hmiNext")}</span>
        </button>
      </div>
    </div>
  );
}

function HmiModuleLinks() {
  const { t } = useTranslation();
  const modules = [
    { href: PATHS.DEBTS, label: t("nav.debts"), icon: Card },
    { href: PATHS.INSTALLMENTS, label: t("nav.installments"), icon: Calendar },
    { href: PATHS.CHECKS, label: t("nav.checks"), icon: MoneyRecive },
    { href: PATHS.COMMITMENTS, label: t("nav.commitments"), icon: Wallet },
    { href: PATHS.PROJECTS, label: t("nav.projects"), icon: Briefcase },
    { href: PATHS.NOTES, label: t("nav.notes"), icon: DocumentText },
    { href: PATHS.ANALYSIS, label: t("nav.financialAnalysis"), icon: Chart2 },
  ];

  return (
    <div className="pb-hmi-surface pb-hmi-modules">
      <h3 className="font-bold">{t("common.quickAccess")}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="pb-hmi-module-link"
          >
            <item.icon size={21} />
            <span>{item.label}</span>
            <ArrowLeft2 className="ms-auto text-muted" size={17} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HmiDashboardPage({
  mode,
  user,
  budgets,
  totalIncome,
  totalCost,
  loading,
  periodLabel,
  duration,
  year,
  month,
  day,
  calendarType,
  onShiftMonth,
  onShiftDay,
  onDurationChange,
  onSelectDate,
}: HmiDashboardPageProps) {
  const { t } = useTranslation();
  const persianMonth = resolvePersianMonth(year, month, day, calendarType);
  const { days: holidayDays, loading: holidayLoading, error: holidayError } =
    usePersianCalendar(persianMonth.year);
  const selectedKey = `${persianMonth.year}/${String(persianMonth.month).padStart(2, "0")}/${String(persianMonth.selectedDay).padStart(2, "0")}`;
  const holidayMap = useMemo(
    () => new Map(holidayDays.map((item) => [item.shamsiDate, item])),
    [holidayDays],
  );
  const selectedHoliday = holidayMap.get(selectedKey);
  const displayCurrency = user?.preferences?.currency ?? "toman";
  const balance = getWalletBalance(user, displayCurrency);
  const firstName = user?.firstName || "دوست عزیز";
  const onSelectDay = (selectedDay: number) => {
    const next = getJalaliNow()
      .jYear(persianMonth.year)
      .jMonth(persianMonth.month - 1)
      .jDate(selectedDay);
    if (calendarType === "gregorian") {
      onSelectDate({
        year: String(next.year()),
        month: String(next.month() + 1),
        day: String(next.date()),
      });
    } else {
      onSelectDate({
        year: String(next.jYear()),
        month: String(next.jMonth() + 1),
        day: String(next.jDate()),
      });
    }
  };
  const selectedDateLabel =
    duration === "daily"
      ? periodLabel
      : `${toPersianDigits(String(persianMonth.selectedDay))} ${periodLabel}`;

  const greeting = (
    <div className="pb-hmi-greeting">
      <div>
        <p className="text-sm font-medium text-muted">{t("common.hmiGreeting", { name: firstName })}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {mode === "command" ? t("common.hmiCommandTitle") : mode === "notebook" ? t("common.hmiNotebookTitle") : t("common.hmiCalendarTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">{t("common.hmiGreetingSubtitle")}</p>
      </div>
      <span className="pb-hmi-greeting-icon" aria-hidden="true">
        {mode === "notebook" ? <Book1 size={30} /> : mode === "command" ? <Wallet3 size={30} /> : <Calendar1 size={30} />}
      </span>
    </div>
  );

  const summary = (
    <div className="pb-hmi-summary">
      <div className="pb-hmi-summary-heading">
        <div>
          <p className="text-xs font-medium text-muted">{t("common.hmiSelectedDay")}</p>
          <p className="mt-1 text-lg font-bold">{selectedDateLabel}</p>
        </div>
        <Clock size={22} className="text-accent" />
      </div>
      <HmiCalendarStatus holiday={selectedHoliday} loading={holidayLoading} error={holidayError} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="pb-hmi-mini-stat" data-tone="income">
          <MoneyAdd size={19} />
          <span><small>{t("common.income")}</small><strong>{formatPriceWithCurrency(totalIncome, displayCurrency)}</strong></span>
        </div>
        <div className="pb-hmi-mini-stat" data-tone="expense">
          <MoneyRemove size={19} />
          <span><small>{t("common.expense")}</small><strong>{formatPriceWithCurrency(totalCost, displayCurrency)}</strong></span>
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="pb-hmi-action-grid">
      <HmiAction href={PATHS.CREATE_BUDGET} icon={<MoneyAdd size={26} />} title={t("common.income")} subtitle={t("common.hmiIncomeActionDesc")} tone="income" />
      <HmiAction href={PATHS.CREATE_BUDGET} icon={<MoneyRemove size={26} />} title={t("common.expense")} subtitle={t("common.hmiExpenseActionDesc")} tone="expense" />
      <HmiAction href={PATHS.ANALYSIS} icon={<Chart2 size={26} />} title={t("nav.financialAnalysis")} subtitle={t("common.hmiAnalysisActionDesc")} />
      <HmiAction href={PATHS.SETTINGS} icon={<Setting2 size={26} />} title={t("nav.settings")} subtitle={t("common.hmiSettingsActionDesc")} />
    </div>
  );

  if (mode === "command") {
    return (
      <section className="pb-hmi-dashboard pb-hmi-command" aria-label={t("common.hmiCommandTitle")}>
        {greeting}
        <div className="pb-hmi-command-balance">
          <div><span>{t("common.walletBalance")}</span><strong>{formatPriceWithCurrency(balance, displayCurrency)}</strong></div>
          <Wallet3 size={42} aria-hidden="true" />
        </div>
        {actions}
        <div className="pb-hmi-command-lower">
          <div className="pb-hmi-surface">
            <HmiPeriodControls periodLabel={periodLabel} duration={duration} onDurationChange={onDurationChange} onShift={(delta) => (duration === "daily" ? onShiftDay(delta) : onShiftMonth(delta))} />
            <div className="mt-4"><HmiCalendarGrid month={persianMonth} holidayDays={holidayDays} selectedKey={selectedKey} onSelectDay={onSelectDay} variant="compact" /></div>
          </div>
          <div className="pb-hmi-surface">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{t("common.hmiLatestEntries")}</h3><Link href={PATHS.HOME} className="text-xs font-semibold text-accent">{t("common.all")}</Link></div>
            {loading ? <TransactionListSkeleton /> : budgets.length ? <ul className="flex flex-col gap-2">{budgets.slice(0, 3).map((budget) => <SimpleTransactionCard key={budget._id} budget={budget} />)}</ul> : <p className="py-8 text-center text-sm text-muted">{t("common.hmiNoLatestEntries")}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (mode === "notebook") {
    return (
      <section className="pb-hmi-dashboard pb-hmi-notebook" aria-label={t("common.hmiNotebookTitle")}>
        {greeting}
        <div className="pb-hmi-notebook-layout">
          <div className="pb-hmi-notebook-page pb-hmi-surface">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-accent">{t("common.hmiYearLabel", { year: toPersianDigits(String(persianMonth.year)) })}</p><h3 className="mt-1 text-xl font-extrabold">{periodLabel}</h3></div><Book1 size={30} className="text-accent" /></div>
            <HmiCalendarGrid month={persianMonth} holidayDays={holidayDays} selectedKey={selectedKey} onSelectDay={onSelectDay} variant="notebook" />
            <div className="mt-4 flex items-center gap-3 text-xs text-muted"><span className="pb-hmi-legend-dot" data-tone="holiday" /> {t("common.hmiHolidayLegend")} <span className="pb-hmi-legend-dot" data-tone="today" /> {t("common.hmiTodayLegend")}</div>
          </div>
          <div className="flex flex-col gap-3">
            {summary}
            <div className="pb-hmi-surface"><HmiPeriodControls periodLabel={periodLabel} duration={duration} onDurationChange={onDurationChange} onShift={(delta) => (duration === "daily" ? onShiftDay(delta) : onShiftMonth(delta))} /></div>
            <LinkButton href={PATHS.CREATE_BUDGET} fullWidth><AddCircle size={20} /> {t("common.hmiRegisterForDay")}</LinkButton>
          </div>
        </div>
        <div className="pb-hmi-surface"><h3 className="mb-3 font-bold">{t("common.hmiRangeEntries")}</h3>{loading ? <TransactionListSkeleton /> : budgets.length ? <ul className="grid gap-2 sm:grid-cols-2">{budgets.slice(0, 6).map((budget) => <SimpleTransactionCard key={budget._id} budget={budget} />)}</ul> : <p className="py-6 text-sm text-muted">{t("common.hmiNoEntries")}</p>}</div>
        <HmiModuleLinks />
      </section>
    );
  }

  return (
    <section className="pb-hmi-dashboard pb-hmi-calendar-command" aria-label={t("common.hmiCalendarTitle")}>
      {greeting}
      <div className="pb-hmi-calendar-layout">
        <div className="pb-hmi-surface pb-hmi-calendar-main">
          <HmiPeriodControls periodLabel={periodLabel} duration={duration} onDurationChange={onDurationChange} onShift={(delta) => (duration === "daily" ? onShiftDay(delta) : onShiftMonth(delta))} />
          <div className="mt-4"><HmiCalendarGrid month={persianMonth} holidayDays={holidayDays} selectedKey={selectedKey} onSelectDay={onSelectDay} variant="calendar" /></div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted"><span className="pb-hmi-legend-dot" data-tone="holiday" /> {t("common.hmiHolidayLegend")} <span className="pb-hmi-legend-dot" data-tone="today" /> {t("common.hmiTodayLegend")} {holidayLoading ? `· ${t("common.hmiHolidayLoading")}` : ""}</div>
        </div>
        <div className="flex flex-col gap-3">{summary}{actions}</div>
      </div>
      <div className="pb-hmi-surface"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{t("common.hmiSelectedTransactions")}</h3><span className="text-xs text-muted">{t("common.hmiItemsCount", { count: toPersianDigits(String(budgets.length)) })}</span></div>{loading ? <TransactionListSkeleton /> : budgets.length ? <ul className="grid gap-2 sm:grid-cols-2">{budgets.slice(0, 6).map((budget) => <SimpleTransactionCard key={budget._id} budget={budget} />)}</ul> : <p className="py-8 text-center text-sm text-muted">{t("common.hmiNoEntries")}</p>}</div>
    </section>
  );
}
