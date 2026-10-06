"use client";

import { useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import { Flash, InfoCircle, Magicpen, Refresh2, TickCircle, Warning2 } from "iconsax-reactjs";

import { requestAiInsights } from "@/common/api/ai";
import type { AiInsightImpact, AiInsightTone, AiInsightsResponse, AiStatus } from "@/common/interfaces/ai.interface";
import { formatPrice } from "@/common/utils";
import { getJalaliNow } from "@/common/utils/jalali-date";
import { showErrorToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

type PeriodId = "this" | "last" | "year";

const TONE_STYLE: Record<AiInsightTone, { box: string; icon: typeof TickCircle; iconClass: string }> = {
  good: { box: "border-success/40 bg-success/8", icon: TickCircle, iconClass: "text-success" },
  warn: { box: "border-warning/50 bg-warning/10", icon: Warning2, iconClass: "text-warning-foreground" },
  risk: { box: "border-danger/40 bg-danger/8", icon: Warning2, iconClass: "text-danger" },
  info: { box: "border-border/60 bg-surface-secondary", icon: InfoCircle, iconClass: "text-accent" },
};

const IMPACT_COLOR: Record<AiInsightImpact, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

function periodParams(period: PeriodId) {
  const now = getJalaliNow();
  let year = now.jYear();
  let month = now.jMonth() + 1;
  if (period === "year") return { duration: "yearly" as const, year: String(year) };
  if (period === "last") {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return { duration: "monthly" as const, year: String(year), month: String(month) };
}

export function AiInsightsPanel({ enabled, onStatus }: { enabled: boolean; onStatus: (status: AiStatus) => void }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodId>("this");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiInsightsResponse | null>(null);

  async function analyse(force = false) {
    setLoading(true);
    try {
      const response = await requestAiInsights({ ...periodParams(period), force });
      setResult(response);
      onStatus(response.status);
    } catch (error) {
      showErrorToast(error, t("common.ai.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const periods: Array<{ id: PeriodId; label: string }> = [
    { id: "this", label: t("common.ai.periodThisMonth") },
    { id: "last", label: t("common.ai.periodLastMonth") },
    { id: "year", label: t("common.ai.periodThisYear") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("common.ai.tabInsights")}>
          {periods.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={period === item.id ? "primary" : "secondary"}
              onPress={() => {
                setPeriod(item.id);
                setResult(null);
              }}
              isDisabled={loading}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Button onPress={() => void analyse(false)} isPending={loading} isDisabled={!enabled}>
          <Magicpen size={18} variant="Bold" />
          {t("common.ai.analyze")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy>
          <p className="text-sm text-muted">{t("common.ai.analyzing")}</p>
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      ) : result ? (
        <div className="space-y-5">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm">{result.period}</Chip>
              {result.cached ? (
                <Chip size="sm" color="success">
                  {t("common.ai.cachedBadge")}
                </Chip>
              ) : null}
            </div>
            <h2 className="text-xl font-extrabold leading-8 sm:text-2xl">{result.insights.headline}</h2>
            <p className="leading-7 text-muted">{result.insights.summary}</p>
          </header>

          {result.insights.highlights.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold">{t("common.ai.highlights")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.insights.highlights.map((item) => {
                  const style = TONE_STYLE[item.tone];
                  const Icon = style.icon;
                  return (
                    <article key={item.title} className={`rounded-2xl border p-4 ${style.box}`}>
                      <div className="flex items-start gap-2.5">
                        <Icon size={20} variant="Bold" className={`mt-0.5 shrink-0 ${style.iconClass}`} />
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {result.insights.actions.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-bold">{t("common.ai.actions")}</h3>
              <ol className="space-y-3">
                {result.insights.actions.map((item, index) => (
                  <li key={item.title} className="flex gap-3 rounded-2xl border border-border/60 bg-surface p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-sm font-bold text-accent">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{item.title}</h4>
                        <Chip size="sm" color={IMPACT_COLOR[item.impact]}>
                          {t(`common.ai.impact${item.impact === "high" ? "High" : item.impact === "medium" ? "Medium" : "Low"}`)}
                        </Chip>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                      {item.estimatedMonthlySaving ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-success-foreground">
                          <Flash size={14} variant="Bold" />
                          {t("common.ai.savePerMonth", { amount: formatPrice(item.estimatedMonthlySaving) })}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {result.insights.watchouts.length > 0 ? (
            <section className="space-y-2 rounded-2xl border border-warning/40 bg-warning/8 p-4">
              <h3 className="text-sm font-bold">{t("common.ai.watchouts")}</h3>
              <ul className="list-disc space-y-1 ps-5 text-sm leading-6">
                {result.insights.watchouts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.insights.savingsGoal ? (
            <section className="rounded-2xl border border-accent/30 bg-accent/8 p-4">
              <h3 className="text-sm font-bold">{t("common.ai.savingsGoal")}</h3>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {formatPrice(result.insights.savingsGoal.monthlyAmount)}
                <span className="ms-2 text-sm font-medium text-muted">{t("common.ai.perMonth")}</span>
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">{result.insights.savingsGoal.rationale}</p>
            </section>
          ) : null}

          <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{t("common.ai.generatedBy", { model: result.model })}</span>
            <Button size="sm" variant="ghost" onPress={() => void analyse(true)} isDisabled={!enabled}>
              <Refresh2 size={15} />
              {t("common.ai.reanalyze")}
            </Button>
          </footer>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-8 text-center">
          <Magicpen size={34} variant="Bold" className="mx-auto text-accent" />
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{t("common.ai.insightsEmpty")}</p>
        </div>
      )}
    </div>
  );
}
