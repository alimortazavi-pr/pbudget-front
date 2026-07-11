"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import type { AnalyticsInsight } from "@/common/interfaces/analytics.interface";

const SEVERITY_STYLES: Record<
  AnalyticsInsight["severity"],
  { border: string; bg: string; dot: string }
> = {
  positive: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    dot: "bg-emerald-500",
  },
  neutral: {
    border: "border-border",
    bg: "bg-surface-secondary/60",
    dot: "bg-muted",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    dot: "bg-amber-500",
  },
  critical: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/8",
    dot: "bg-rose-500",
  },
};

type AnalysisInsightsPanelProps = {
  insights: AnalyticsInsight[];
  periodLabel: string;
};

export function AnalysisInsightsPanel({
  insights,
  periodLabel,
}: AnalysisInsightsPanelProps) {
  const { t } = useTranslation();
  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold lg:text-lg">{t("auto.ke1b7612b05")}</h2>
        <p className="text-sm text-muted">
          {t("auto.kffb6e7a1c6")}{periodLabel}»
        </p>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = SEVERITY_STYLES[insight.severity];
          return (
            <article
              key={insight.id}
              className={`rounded-xl border p-4 ${style.border} ${style.bg}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`size-2 rounded-full ${style.dot}`} />
                <h3 className="font-semibold">{insight.title}</h3>
              </div>
              <p className="text-sm leading-7 text-muted">{insight.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
