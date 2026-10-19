"use client";

import { ArrowDown, ArrowUp } from "iconsax-reactjs";

import { formatPercentShort } from "@/common/utils/asset-format";
import { useTranslation } from "@/i18n";

type Props = {
  profit: number;
  percent: number | null;
  money: (amount: number) => string;
  className?: string;
};

/** "↑ ۲۰٪  ۳٬۰۰۰٬۰۰۰ تومان سود": words instead of +/− signs, so right-to-left text never garbles them. */
export function ProfitChip({ profit, percent, money, className = "" }: Props) {
  const { t } = useTranslation();
  const tone = profit > 0 ? "bg-income-soft text-income" : profit < 0 ? "bg-expense-soft text-expense" : "bg-surface-secondary text-muted";
  if (profit === 0) {
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tone} ${className}`}>{t("feat.assets.heroEven")}</span>;
  }
  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs ${tone} ${className}`}>
      {profit > 0 ? <ArrowUp size={13} variant="Bold" /> : <ArrowDown size={13} variant="Bold" />}
      {percent != null ? <b>{formatPercentShort(percent)}٪</b> : null}
      <span className="font-medium">
        {money(Math.abs(profit))} {profit > 0 ? t("feat.assets.profitWord") : t("feat.assets.lossWord")}
      </span>
    </span>
  );
}
