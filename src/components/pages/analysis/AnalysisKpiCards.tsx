"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  ArrowDown,
  ArrowSwapHorizontal,
  ArrowUp,
  Chart,
  Coin1,
  PercentageCircle,
  Wallet2,
} from "iconsax-reactjs";

import type { AnalyticsReport } from "@/common/interfaces/analytics.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";

type AnalysisKpiCardsProps = {
  report: AnalyticsReport;
};

function ChangeBadge({ value }: { value: number }) {
  const { t } = useTranslation();
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-xs font-medium ${
        positive
          ? "bg-success/15 text-success-foreground"
          : "bg-danger/15 text-danger-foreground"
      }`}
    >
      {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {toPersianDigits(Math.abs(value).toFixed(1))}
      {t("common.percentSign")}
    </span>
  );
}

function KpiCard({
  title,
  value,
  suffix,
  icon,
  change,
  tone = "default",
}: {
  title: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  change?: number;
  tone?: "default" | "income" | "cost" | "net";
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-500"
      : tone === "cost"
        ? "text-rose-500"
        : tone === "net"
          ? "text-violet-500"
          : "text-accent";

  return (
    <div className="pb-analysis-kpi glass rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={`rounded-xl bg-surface-secondary p-2 ${toneClass}`}>
          {icon}
        </div>
        {change != null && <ChangeBadge value={change} />}
      </div>
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-1 text-xl font-bold tracking-tight lg:text-2xl">
        {value}
        {suffix && (
          <span className="ms-1 text-sm font-normal text-muted">{suffix}</span>
        )}
      </p>
    </div>
  );
}

export function AnalysisKpiCards({ report }: AnalysisKpiCardsProps) {
  const { t } = useTranslation();
  const { summary, comparison } = report;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
      <KpiCard
        title={t("auto.k1a6ef51534")}
        value={formatPrice(summary.userBalance)}
        suffix={t("auto.k9e29f60874")}
        icon={<Wallet2 size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("auto.k8dc3b9a771")}
        value={formatPrice(summary.income)}
        suffix={t("auto.k9e29f60874")}
        icon={<ArrowUp size={20} variant="Bold" />}
        change={comparison?.incomeChangePercent}
        tone="income"
      />
      <KpiCard
        title={t("auto.kbd6109e27e")}
        value={formatPrice(summary.cost)}
        suffix={t("auto.k9e29f60874")}
        icon={<ArrowDown size={20} variant="Bold" />}
        change={comparison?.costChangePercent}
        tone="cost"
      />
      <KpiCard
        title={t("auto.k35b908d245")}
        value={formatPrice(summary.net)}
        suffix={t("auto.k9e29f60874")}
        icon={<ArrowSwapHorizontal size={20} variant="Bold" />}
        change={comparison?.netChangePercent}
        tone="net"
      />
      <KpiCard
        title={t("auto.kb784dfefb5")}
        value={toPersianDigits(summary.savingsRate.toFixed(1))}
        suffix={t("auto.ka367d4888a")}
        icon={<PercentageCircle size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("auto.k4af4c17de7")}
        value={toPersianDigits(summary.transactionCount)}
        icon={<Chart size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("auto.k05b0a3e75c")}
        value={formatPrice(Math.round(summary.avgDailyCost))}
        suffix={t("auto.k9e29f60874")}
        icon={<Coin1 size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("auto.k76d12f4b06")}
        value={formatPrice(summary.netWorth)}
        suffix={t("auto.k9e29f60874")}
        icon={<Wallet2 size={20} variant="Bold" />}
      />
    </section>
  );
}
