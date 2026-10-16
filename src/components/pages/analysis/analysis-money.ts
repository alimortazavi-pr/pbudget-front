import { useCallback } from "react";

import { resolveBudgetCurrency } from "@/common/constants/user-preferences";
import { formatAmountOnly } from "@/common/utils/format-currency";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

import { formatChartPrice } from "./chart-colors";

/**
 * The analytics report is computed in the user's preferred currency, so
 * amounts must be formatted (and labelled) for that currency — the toman
 * helpers would show dollars as «تومان» and multiply them by 10 in rial mode.
 */
export function useAnalysisMoney() {
  const user = useAppSelector(userSelector);
  const currency = resolveBudgetCurrency(user?.preferences?.currency);
  const { displayCurrencyLabel } = useCurrencyLabels();
  const money = useCallback((amount: number) => formatAmountOnly(amount, currency), [currency]);
  const chartPrice = useCallback((amount: number) => formatChartPrice(amount, currency), [currency]);
  return { currency, money, chartPrice, unit: displayCurrencyLabel(currency) };
}
