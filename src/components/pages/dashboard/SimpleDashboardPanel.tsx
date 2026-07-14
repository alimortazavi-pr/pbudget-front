"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

import {
  DEFAULT_USER_PREFERENCES,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type SimpleDashboardPanelProps = {
  duration: string;
  year: string;
  month: string;
  day: string;
  periodLabel: string;
  income: number;
  expense: number;
  count: number;
  onDurationChange: (duration: "monthly" | "daily") => void;
  onShiftPeriod: (delta: number) => void;
};

export function SimpleDashboardPanel({
  duration,
  periodLabel,
  income,
  expense,
  count,
  onDurationChange,
  onShiftPeriod,
}: SimpleDashboardPanelProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const { formatCount } = useLocalizedDate();
  const user = useAppSelector(userSelector);
  const preferred: UserCurrency =
    user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const balance = getWalletBalance(user, preferred);
  const isDaily = duration === "daily";

  return (
    <section className="glass pb-simple-panel">
      <div className="pb-simple-duration-tabs">
        <button
          type="button"
          className="pb-simple-duration-tab"
          data-active={isDaily ? "true" : "false"}
          onClick={() => onDurationChange("daily")}
        >
          {t("common.daily")}
        </button>
        <button
          type="button"
          className="pb-simple-duration-tab"
          data-active={!isDaily ? "true" : "false"}
          onClick={() => onDurationChange("monthly")}
        >
          {t("common.monthly")}
        </button>
      </div>

      <div className="pb-simple-period-nav">
        <button
          type="button"
          className="pb-simple-period-btn"
          onClick={() => onShiftPeriod(-1)}
        >
          <ArrowRight2 size={16} />
          <span>{isDaily ? t("dashboard.simplePrevDay") : t("dashboard.simplePrevMonth")}</span>
        </button>
        <p className="pb-simple-period-label">{periodLabel}</p>
        <button
          type="button"
          className="pb-simple-period-btn"
          onClick={() => onShiftPeriod(1)}
        >
          <span>{isDaily ? t("dashboard.simpleNextDay") : t("dashboard.simpleNextMonth")}</span>
          <ArrowLeft2 size={16} />
        </button>
      </div>

      <hr className="my-4 border-border/60" />

      <div className="space-y-2">
        <div className="pb-simple-stat-balance">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white/90">
              {t("dashboard.simpleBalance")}
            </p>
            {balance < 0 ? (
              <span className="text-xs font-medium text-rose-200">
                {t("dashboard.insufficientFundsShort")}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-end text-2xl font-bold text-white tabular-nums">
            {formatPriceWithCurrency(balance, preferred)}
            <span className="ms-1.5 text-xs font-medium text-white/75">
              {currencyLabel(preferred)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="pb-simple-stat-income">
            <p className="text-sm font-semibold text-white/95">
              {t("dashboard.simpleTotalIncome")}
            </p>
            <p className="mt-2 text-end text-lg font-bold text-white tabular-nums">
              {formatPriceWithCurrency(income, preferred)}
            </p>
          </div>
          <div className="pb-simple-stat-expense">
            <p className="text-sm font-semibold text-white/95">
              {t("dashboard.simpleTotalExpense")}
            </p>
            <p className="mt-2 text-end text-lg font-bold text-white tabular-nums">
              {formatPriceWithCurrency(expense, preferred)}
            </p>
          </div>
        </div>

        <div className="pb-simple-stat-count">
          <span className="text-sm font-bold text-white">
            {t("dashboard.simpleTransactionCount")}
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatCount(count)}
          </span>
        </div>
      </div>
    </section>
  );
}
