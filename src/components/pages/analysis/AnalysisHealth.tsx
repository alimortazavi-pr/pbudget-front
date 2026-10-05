"use client";

import { useMemo } from "react";

import type { AnalyticsReport } from "@/common/interfaces/analytics.interface";
import { formatPrice } from "@/common/utils";
import { moneyDisplayUnitLabel } from "@/common/utils/money-display";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";

type Tip = { id: string; tone: "good" | "warn" | "bad"; text: string };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * 0–100 "financial health": savings (40) + staying under category limits (25)
 * + cash cushion in months of spending (20) + debt load vs income (15).
 * Nothing is sent anywhere — it is derived from the report already on screen.
 */
export function computeHealth(report: AnalyticsReport) {
  const { summary, categoryBudgets, featureSummary } = report;
  const savings = clamp(summary.savingsRate / 20) * 40;

  const limits = categoryBudgets.filter((row) => row.monthlyLimit > 0);
  const limitScore = limits.length
    ? (limits.filter((row) => !row.isOverLimit).length / limits.length) * 25
    : 17;

  const monthlyCost = summary.cost > 0 ? summary.cost : 0;
  const cushionMonths = monthlyCost > 0 ? (summary.userBalance + summary.boxesTotal) / monthlyCost : summary.userBalance > 0 ? 3 : 0;
  const cushion = clamp(cushionMonths / 3) * 20;

  const payable = featureSummary.debts.payableRemaining;
  const debtScore = summary.income > 0 ? (1 - clamp(payable / (summary.income * 2))) * 15 : payable > 0 ? 4 : 12;

  const score = Math.round(savings + limitScore + cushion + debtScore);
  const parts = [
    { id: "savings", value: savings, max: 40 },
    { id: "limits", value: limitScore, max: 25 },
    { id: "cushion", value: cushion, max: 20 },
    { id: "debt", value: debtScore, max: 15 },
  ];
  return { score: clamp(score, 0, 100), cushionMonths, limits, payable, parts };
}

export function AnalysisHealth({ report }: { report: AnalyticsReport }) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  const unit = moneyDisplayUnitLabel();
  const { score, cushionMonths, limits, payable, parts } = useMemo(() => computeHealth(report), [report]);
  const { summary } = report;

  const level = score >= 80 ? "great" : score >= 60 ? "good" : score >= 40 ? "fair" : "weak";
  const tone = score >= 60 ? "var(--brand-teal-deep)" : score >= 40 ? "#d97706" : "var(--brand-rose-deep)";

  const tips = useMemo<Tip[]>(() => {
    const list: Tip[] = [];
    const over = limits.filter((row) => row.isOverLimit);
    if (summary.income <= 0 && summary.cost > 0) list.push({ id: "noincome", tone: "warn", text: t("pages.analysis.tipNoIncome") });
    else if (summary.savingsRate < 0) list.push({ id: "deficit", tone: "bad", text: t("pages.analysis.tipDeficit", { amount: `${formatPrice(Math.abs(summary.net))} ${unit}` }) });
    else if (summary.savingsRate < 10) list.push({ id: "lowsave", tone: "warn", text: t("pages.analysis.tipLowSavings", { amount: `${formatPrice(Math.round(summary.income * 0.1))} ${unit}` }) });
    else if (summary.savingsRate >= 20) list.push({ id: "goodsave", tone: "good", text: t("pages.analysis.tipGoodSavings", { rate: formatCount(Math.round(summary.savingsRate)) }) });
    const top = report.topExpenses[0];
    if (top && top.share >= 40) list.push({ id: "top", tone: "warn", text: t("pages.analysis.tipTopCategory", { title: top.title, share: formatCount(Math.round(top.share)) }) });
    if (over.length) list.push({ id: "over", tone: "bad", text: t("pages.analysis.tipOverLimit", { titles: over.slice(0, 3).map((row) => row.title).join("، ") }) });
    if (cushionMonths < 1 && summary.cost > 0) list.push({ id: "cushion", tone: "warn", text: t("pages.analysis.tipCushion") });
    if (payable > 0 && summary.income > 0 && payable > summary.income) list.push({ id: "debt", tone: "warn", text: t("pages.analysis.tipDebt") });
    if (!list.length) list.push({ id: "ok", tone: "good", text: t("pages.analysis.tipAllGood") });
    return list.slice(0, 4);
  }, [report, limits, summary, cushionMonths, payable, t, unit, formatCount]);

  const circumference = 2 * Math.PI * 52;

  return (
    <section className="pb-panel overflow-hidden p-4 lg:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto size-36 shrink-0 sm:mx-0 lg:size-40">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-secondary)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1), stroke .4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber value={score} format={(n) => formatCount(Math.round(n))} className="text-4xl font-extrabold leading-none" />
            <span className="mt-1 text-[11px] font-medium text-muted">{t("pages.analysis.outOf100")}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{t("pages.analysis.healthTitle")}</p>
          <h2 className="mt-0.5 text-xl font-extrabold lg:text-2xl" style={{ color: tone }}>
            {t(`pages.analysis.health_${level}`)}
          </h2>
          <ul className="pb-stagger mt-3 space-y-2">
            {tips.map((tip, index) => (
              <li key={tip.id} style={{ ["--i" as string]: index }} className="flex items-start gap-2 text-sm leading-6">
                <span
                  className="mt-2 size-2 shrink-0 rounded-full"
                  style={{ background: tip.tone === "good" ? "var(--brand-teal-deep)" : tip.tone === "warn" ? "#d97706" : "var(--brand-rose-deep)" }}
                />
                <span className="text-foreground/90">{tip.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid w-full shrink-0 grid-cols-2 gap-x-4 gap-y-3 sm:w-64 sm:grid-cols-1">
          {parts.map((part) => (
            <div key={part.id}>
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted">
                <span>{t(`pages.analysis.part_${part.id}`)}</span>
                <span>{formatCount(Math.round(part.value))}/{formatCount(part.max)}</span>
              </div>
              <div className="pb-meter"><span style={{ width: `${(part.value / part.max) * 100}%`, background: tone }} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
