"use client";

import { ArrowDown, ArrowUp, Wallet2 } from "iconsax-reactjs";

import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type DashboardHeroProps = {
  firstName?: string;
  income: number;
  expense: number;
  simple?: boolean;
  "data-tour"?: string;
};

function walletDisplayOrder(preferred: UserCurrency): UserCurrency[] {
  return [
    preferred,
    ...CURRENCY_OPTIONS.map((option) => option.id).filter(
      (currency) => currency !== preferred,
    ),
  ];
}

export function DashboardHero({
  firstName,
  income,
  expense,
  simple = false,
  "data-tour": dataTour,
}: DashboardHeroProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const preferred =
    user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const currency = preferred;
  const orderedCurrencies = walletDisplayOrder(preferred);

  return (
    <section
      className="pb-dashboard-hero relative -mx-4 overflow-hidden px-4 pb-6 pt-0 lg:mx-0 lg:rounded-3xl lg:px-8 lg:pb-8 lg:pt-6"
      data-tour={dataTour}
    >
      <div className="pointer-events-none absolute -end-8 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 start-0 size-32 rounded-full bg-white/8 blur-xl" />

      <div className="relative z-10 pt-3 lg:pt-0">
        <div className="mb-5 flex items-start justify-between gap-3 lg:mb-0">
          <div>
            <p className="text-sm font-medium text-white/85 lg:text-base">
              {t("dashboard.greeting", {
                name: firstName ?? t("dashboard.defaultUserName"),
              })}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-white lg:text-2xl">
              {simple
                ? t("dashboard.simpleDashboardTitle")
                : t("dashboard.financialDashboard")}
            </h2>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm lg:size-12">
            <Wallet2 size={22} color="#fff" variant="Bold" />
          </div>
        </div>

        <div className="pb-dashboard-hero-body">
          <div className="mt-5 lg:mt-6">
            <div className="rounded-2xl border border-white/20 bg-white/12 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md lg:p-6">
              <p className="text-xs font-medium text-white/75 lg:text-sm">
                {t("dashboard.walletBalance")}
              </p>
              <div className="mt-3 space-y-3">
                {orderedCurrencies.map((walletCurrency) => {
                  const amount = getWalletBalance(user, walletCurrency);
                  const isPreferred = walletCurrency === preferred;
                  if (!isPreferred && amount === 0) {
                    return null;
                  }

                  const isNegative = amount < 0;
                  return (
                    <div
                      key={walletCurrency}
                      className={
                        isPreferred
                          ? ""
                          : "rounded-xl border border-white/15 bg-black/10 px-3 py-2.5"
                      }
                    >
                      {isNegative ? (
                        <p className="text-xs font-medium text-rose-200">
                          {t("dashboard.insufficientFunds", {
                            currency: currencyLabel(walletCurrency),
                          })}
                        </p>
                      ) : null}
                      <div className="flex items-end justify-between gap-4">
                        <p
                          className={
                            isPreferred
                              ? "pb-balance-amount text-white"
                              : "text-lg font-bold text-white"
                          }
                        >
                          {formatPriceWithCurrency(amount, walletCurrency)}
                        </p>
                        <span className="mb-1 shrink-0 text-sm font-medium text-white/80 lg:text-base">
                          {currencyLabel(walletCurrency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pb-dashboard-hero-stats mt-3 grid grid-cols-2 gap-2 lg:mt-0 lg:gap-4">
            <div className="rounded-xl border border-white/15 bg-black/10 px-3 py-2.5 backdrop-blur-sm lg:px-4 lg:py-4">
              <div className="flex items-center gap-1 text-xs text-white/75 lg:text-sm">
                <ArrowDown size={14} variant="Bold" />
                {t("dashboard.periodIncome")}
              </div>
              <p className="mt-1 text-left text-sm font-bold text-white lg:text-lg">
                {formatPriceWithCurrency(income, currency)}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/10 px-3 py-2.5 backdrop-blur-sm lg:px-4 lg:py-4">
              <div className="flex items-center gap-1 text-xs text-white/75 lg:text-sm">
                <ArrowUp size={14} variant="Bold" />
                {t("dashboard.periodExpense")}
              </div>
              <p className="mt-1 text-left text-sm font-bold text-white lg:text-lg">
                {formatPriceWithCurrency(expense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
