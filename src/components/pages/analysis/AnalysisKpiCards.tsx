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
      {toPersianDigits(Math.abs(value).toFixed(1))}٪
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
        title={t("موجودی حساب")}
        value={formatPrice(summary.userBalance)}
        suffix="تومان"
        icon={<Wallet2 size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("درآمد دوره")}
        value={formatPrice(summary.income)}
        suffix="تومان"
        icon={<ArrowUp size={20} variant="Bold" />}
        change={comparison?.incomeChangePercent}
        tone="income"
      />
      <KpiCard
        title={t("هزینه دوره")}
        value={formatPrice(summary.cost)}
        suffix="تومان"
        icon={<ArrowDown size={20} variant="Bold" />}
        change={comparison?.costChangePercent}
        tone="cost"
      />
      <KpiCard
        title={t("خالص دوره")}
        value={formatPrice(summary.net)}
        suffix="تومان"
        icon={<ArrowSwapHorizontal size={20} variant="Bold" />}
        change={comparison?.netChangePercent}
        tone="net"
      />
      <KpiCard
        title={t("نرخ پس‌انداز")}
        value={toPersianDigits(summary.savingsRate.toFixed(1))}
        suffix="٪"
        icon={<PercentageCircle size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("تعداد تراکنش")}
        value={toPersianDigits(summary.transactionCount)}
        icon={<Chart size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("میانگین هزینه روزانه")}
        value={formatPrice(Math.round(summary.avgDailyCost))}
        suffix="تومان"
        icon={<Coin1 size={20} variant="Bold" />}
      />
      <KpiCard
        title={t("ارزش کل نقدی")}
        value={formatPrice(summary.netWorth)}
        suffix="تومان"
        icon={<Wallet2 size={20} variant="Bold" />}
      />
    </section>
  );
}
