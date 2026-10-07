"use client";

import { useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import { ArrowDown2, ArrowUp2, Calendar2, Refresh2, Warning2 } from "iconsax-reactjs";

import { requestAiPlan } from "@/common/api/ai";
import type { AiObligationKind, AiPlanResponse, AiStatus } from "@/common/interfaces/ai.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { JALALI_MONTHS, getJalaliNow } from "@/common/utils/jalali-date";
import { showErrorToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

const KIND_KEY: Record<AiObligationKind, string> = {
  installment: "kindInstallment",
  check_payable: "kindCheckPayable",
  check_receivable: "kindCheckReceivable",
  debt_payable: "kindDebtPayable",
  debt_receivable: "kindDebtReceivable",
};
const INFLOW: AiObligationKind[] = ["check_receivable", "debt_receivable"];
const WHEN_KEY = { week1: "planWeek1", week2: "planWeek2", week3: "planWeek3", week4: "planWeek4", any: "planAny" } as const;

function Summary({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-base font-extrabold tabular-nums sm:text-lg ${tone}`}>{value}</p>
    </div>
  );
}

export function AiPlanPanel({ enabled, onStatus }: { enabled: boolean; onStatus: (status: AiStatus) => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiPlanResponse | null>(null);
  const nextMonthName = JALALI_MONTHS[(getJalaliNow().jMonth() + 1) % 12] ?? "";

  async function build(force = false) {
    setLoading(true);
    try {
      const response = await requestAiPlan({ force });
      setResult(response);
      onStatus(response.status);
    } catch (error) {
      showErrorToast(error, t("common.ai.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy>
        <p className="text-sm text-muted">{t("common.ai.planBuilding")}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-8 text-center">
        <Calendar2 size={34} variant="Bold" className="mx-auto text-accent" />
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{t("common.ai.planIntro")}</p>
        <Button className="mt-4" onPress={() => void build(false)} isDisabled={!enabled}>
          {t("common.ai.planGenerate", { month: nextMonthName })}
        </Button>
      </div>
    );
  }

  const { plan, facts, totals } = result;

  return (
    <div className="space-y-5">
      <header className="space-y-2 rounded-2xl border border-border/60 bg-gradient-to-br from-accent/10 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm">{facts.target.label}</Chip>
          {result.cached ? (
            <Chip size="sm" color="success">
              {t("common.ai.cachedBadge")}
            </Chip>
          ) : null}
        </div>
        <h2 className="text-xl font-extrabold leading-8 sm:text-2xl">{plan.headline}</h2>
        <p className="leading-7 text-muted">{plan.summary}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Summary label={t("common.ai.planExpectedIncome")} value={formatPrice(facts.expectedIncome)} />
        <Summary label={t("common.ai.planFixed")} value={formatPrice(totals.fixed)} />
        <Summary label={t("common.ai.planBudgeted")} value={formatPrice(totals.budgeted)} />
        <Summary label={t("common.ai.planSavings")} value={formatPrice(totals.savings)} tone="text-accent" />
        <Summary label={t("common.ai.planLeftover")} value={formatPrice(totals.leftover)} tone={totals.leftover < 0 ? "text-danger" : "text-success"} />
      </div>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-surface p-4">
        <h3 className="text-sm font-bold">{t("common.ai.planObligations")}</h3>
        {facts.obligations.length === 0 ? (
          <p className="text-sm text-muted">{t("common.ai.planObligationsEmpty")}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {facts.obligations.map((item, index) => {
              const inflow = INFLOW.includes(item.kind);
              return (
                <li key={`${item.title}-${index}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-16 shrink-0 text-xs text-muted">{t("common.ai.planDay", { day: toPersianDigits(String(item.day)) })}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                  <Chip size="sm" color={inflow ? "success" : "default"}>
                    {t(`common.ai.${KIND_KEY[item.kind]}`)}
                  </Chip>
                  <span className={`shrink-0 font-semibold tabular-nums ${inflow ? "text-success" : ""}`}>{formatPrice(item.amount)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {facts.expectedInflowUncertain > 0 ? (
          <p className="text-xs text-muted">{t("common.ai.planUncertain", { amount: formatPrice(facts.expectedInflowUncertain) })}</p>
        ) : null}
      </section>

      {plan.budgets.length > 0 ? (
        <section className="space-y-2 rounded-2xl border border-border/60 bg-surface p-4">
          <h3 className="text-sm font-bold">{t("common.ai.planBudgetTable")}</h3>
          <ul className="divide-y divide-border/50">
            {plan.budgets.map((row) => {
              const diff = row.average > 0 ? ((row.suggested - row.average) / row.average) * 100 : 0;
              const Icon = diff > 0 ? ArrowUp2 : ArrowDown2;
              return (
                <li key={row.categoryId} className="space-y-1 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{row.title}</span>
                    <span className="flex items-center gap-2 text-sm tabular-nums">
                      <span className="text-muted line-through decoration-muted/50">{formatPrice(row.average)}</span>
                      <span className="font-bold">{formatPrice(row.suggested)}</span>
                      {Math.abs(diff) >= 1 ? (
                        <span className={`inline-flex items-center text-xs font-semibold ${diff < 0 ? "text-success" : "text-warning-foreground"}`} dir="ltr">
                          <Icon size={12} variant="Bold" />
                          {toPersianDigits(String(Math.abs(Math.round(diff))))}٪
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {row.reason ? <p className="text-xs leading-6 text-muted">{row.reason}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {plan.steps.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-bold">{t("common.ai.planSteps")}</h3>
          <ol className="space-y-3">
            {plan.steps.map((step, index) => (
              <li key={`${step.title}-${index}`} className="flex gap-3 rounded-2xl border border-border/60 bg-surface p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-sm font-bold text-accent">{toPersianDigits(String(index + 1))}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{step.title}</h4>
                    <Chip size="sm">{t(`common.ai.${WHEN_KEY[step.when] ?? "planAny"}`)}</Chip>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {plan.risks.length > 0 ? (
        <section className="space-y-2 rounded-2xl border border-warning/40 bg-warning/8 p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Warning2 size={16} variant="Bold" />
            {t("common.ai.planRisks")}
          </h3>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-6">
            {plan.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onPress={() => void build(true)} isDisabled={!enabled}>
          <Refresh2 size={15} />
          {t("common.ai.planRegenerate")}
        </Button>
      </div>
    </div>
  );
}
