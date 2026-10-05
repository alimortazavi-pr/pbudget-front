"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowUp, DocumentUpload, Eye, EyeSlash, MoneyRecive, MoneySend } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { OverflowReveal } from "@/components/common/ui/OverflowReveal";
import { formatAmountOnly } from "@/common/utils/format-currency";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type DashboardHeroProps = {
  firstName?: string;
  /** Totals of the period currently shown (after filters). */
  income: number;
  expense: number;
  /** Daily spending of the period, for the sparkline (empty = hide it). */
  trend?: number[];
  "data-tour"?: string;
};

const HIDE_KEY = "pb-hide-balance";

function walletDisplayOrder(preferred: UserCurrency): UserCurrency[] {
  return [preferred, ...CURRENCY_OPTIONS.map((option) => option.id).filter((currency) => currency !== preferred)];
}

/** Smooth area sparkline, drawn in with a stroke animation. */
function Sparkline({ values, label }: { values: number[]; label: string }) {
  const id = useId().replace(/:/g, "");
  const max = Math.max(...values, 1);
  const step = 100 / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => [index * step, 30 - (value / max) * 26] as const);
  const line = points
    .map(([x, y], index) => {
      if (index === 0) return `M${x},${y}`;
      const [px, py] = points[index - 1];
      const cx = (px + x) / 2;
      return `C${cx},${py} ${cx},${y} ${x},${y}`;
    })
    .join(" ");
  const area = `${line} L100,32 L0,32 Z`;
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-16 w-full overflow-visible" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`} className="pb-fade-in" />
      <path d={line} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="pb-draw" />
    </svg>
  );
}

export function DashboardHero({ firstName, income, expense, trend = [], "data-tour": dataTour }: DashboardHeroProps) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const preferred = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(HIDE_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  function toggleHidden() {
    setHidden((value) => {
      try {
        window.localStorage.setItem(HIDE_KEY, value ? "0" : "1");
      } catch {
        /* private mode */
      }
      return !value;
    });
  }

  const balance = getWalletBalance(user, preferred);
  const unit = displayCurrencyLabel(preferred);
  const others = walletDisplayOrder(preferred)
    .slice(1)
    .map((currency) => ({ currency, amount: getWalletBalance(user, currency) }))
    .filter((row) => row.amount !== 0);
  const net = income - expense;
  const total = income + expense;
  const incomeShare = total > 0 ? Math.round((income / total) * 100) : 0;
  const hasTrend = trend.some((value) => value > 0);
  const mask = "••••••";

  const actions = [
    { href: `${PATHS.CREATE_BUDGET}?type=1`, label: t("dashboard.quickExpense"), icon: MoneySend },
    { href: `${PATHS.CREATE_BUDGET}?type=0`, label: t("dashboard.quickIncome"), icon: MoneyRecive },
    { href: PATHS.BANK_IMPORT, label: t("nav.bankImport"), icon: DocumentUpload },
  ];

  return (
    <section className="pb-wallet pb-hero relative text-white" data-tour={dataTour}>
      <span aria-hidden className="pb-hero-dots" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-8">
        {/* ------------------------------------------------ balance */}
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-extrabold backdrop-blur-sm">
                {(firstName ?? "?").trim().charAt(0) || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/85">
                  {t("dashboard.greeting", { name: firstName ?? t("dashboard.defaultUserName") })}
                </p>
                <p className="text-xs text-white/70">{t("dashboard.walletBalance")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleHidden}
              aria-pressed={hidden}
              aria-label={t(hidden ? "dashboard.showBalance" : "dashboard.hideBalance")}
              className="pb-press flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              {hidden ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex min-w-0 items-end gap-2">
            <OverflowReveal full={hidden ? mask : `${formatAmountOnly(balance, preferred)} ${unit}`} className="min-w-0 truncate">
              <span className={`pb-balance-amount text-white ${formatAmountOnly(balance, preferred).length > 13 ? "pb-balance-sm" : ""}`} dir="ltr">
                {hidden ? mask : <AnimatedNumber value={balance} format={(n) => formatAmountOnly(n, preferred)} />}
              </span>
            </OverflowReveal>
            <span className="mb-1.5 shrink-0 text-sm font-semibold text-white/80 lg:text-base">{unit}</span>
          </div>

          <div className="-mt-2 flex flex-wrap items-center gap-2">
            {!hidden && total > 0 ? (
              <span className="pb-wallet-chip" data-tone={net >= 0 ? "up" : "down"}>
                {net >= 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                {t("dashboard.periodNet")}: {net < 0 ? "−" : "+"}
                {formatAmountOnly(Math.abs(net), preferred)} {unit}
              </span>
            ) : null}
            {others.map((row) => (
              <span key={row.currency} className="pb-wallet-chip">
                {hidden ? mask : formatAmountOnly(row.amount, row.currency)} {displayCurrencyLabel(row.currency)}
              </span>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------ period glance */}
        <div className="pb-wallet-panel min-w-0">
          <div className="flex items-center justify-between text-xs font-medium text-white/80">
            <span>{t("dashboard.incomeVsExpense")}</span>
            {total > 0 ? <span>{formatCount(incomeShare)}٪ {t("dashboard.periodIncome")}</span> : null}
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-white/20" role="img" aria-label={t("dashboard.incomeVsExpense")}>
            <span className="pb-bar-x h-full bg-emerald-300" style={{ width: `${total > 0 ? incomeShare : 50}%` }} />
            <span className="h-full flex-1 bg-rose-950/40" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="min-w-0 rounded-xl bg-white/10 px-3 py-2">
              <p className="flex items-center gap-1 text-white/75"><ArrowDown size={12} />{t("dashboard.periodIncome")}</p>
              <OverflowReveal full={`${formatAmountOnly(income, preferred)} ${unit}`} className="mt-0.5 truncate text-sm font-bold">
                {hidden ? mask : formatAmountOnly(income, preferred)}
              </OverflowReveal>
            </div>
            <div className="min-w-0 rounded-xl bg-white/10 px-3 py-2">
              <p className="flex items-center gap-1 text-white/75"><ArrowUp size={12} />{t("dashboard.periodExpense")}</p>
              <OverflowReveal full={`${formatAmountOnly(expense, preferred)} ${unit}`} className="mt-0.5 truncate text-sm font-bold">
                {hidden ? mask : formatAmountOnly(expense, preferred)}
              </OverflowReveal>
            </div>
          </div>
          {hasTrend ? (
            <div className="mt-3">
              <p className="mb-1 text-[11px] text-white/70">{t("dashboard.dailySpending")}</p>
              <Sparkline values={trend} label={t("dashboard.dailySpending")} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ------------------------------------------------ quick actions */}
      <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-6 lg:gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="pb-wallet-action pb-press">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/20">
              <action.icon size={18} variant="Bold" color="#fff" />
            </span>
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
