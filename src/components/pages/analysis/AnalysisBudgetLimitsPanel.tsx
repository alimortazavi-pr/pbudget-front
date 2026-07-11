"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import type { AnalyticsReport } from "@/common/interfaces/analytics.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { formatPrice, toPersianDigits } from "@/common/utils";

type AnalysisBudgetLimitsPanelProps = {
  report: AnalyticsReport;
};

export function AnalysisBudgetLimitsPanel({ report }: AnalysisBudgetLimitsPanelProps) {
  const { t } = useTranslation();
  const rows = report.categoryBudgets ?? [];
  if (rows.length === 0) return null;

  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <div className="mb-4">
        <h3 className="font-bold">{t("auto.kd7abb7015a")}</h3>
        <p className="text-sm text-muted">{t("auto.keb781266c4")}</p>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <article key={row.categoryId} className="rounded-xl bg-surface-secondary/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: resolveCategoryColor(row.color, index) }}
                />
                <div>
                  <p className="font-medium">
                    {row.title}
                    {row.isRollup ? (
                      <span className="ms-1 text-xs text-muted">{t("auto.k3015d3f617")}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {t("auto.kab3e1ccf9b")}{formatPrice(row.monthlyLimit)} · {t("auto.kb0c4ca0499")}{formatPrice(row.spent)}
                  </p>
                </div>
              </div>
              <p
                className={`text-sm font-bold ${
                  row.isOverLimit ? "text-expense" : "text-income"
                }`}
              >
                {row.isOverLimit
                  ? `${formatPrice(row.overLimitAmount)} ${t("nav.more")}`
                  : `${formatPrice(row.remaining)} ${t("auto.k23d4b4c189")}`}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full transition-all ${
                  row.isOverLimit ? "bg-expense" : "bg-accent"
                }`}
                style={{ width: `${Math.min(row.percentOfLimit, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {t("common.percentOfLimit", {
                percent: toPersianDigits(Math.round(row.percentOfLimit)),
              })}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
