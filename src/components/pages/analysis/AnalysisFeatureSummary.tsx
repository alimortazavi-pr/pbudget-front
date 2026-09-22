"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";
import type { AnalyticsFeatureSummary } from "@/common/interfaces/analytics.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { moneyDisplayUnitLabel } from "@/common/utils/money-display";

function Amount({ value }: { value: number }) {
  return (
    <span className="font-semibold">
      {formatPrice(value)} {moneyDisplayUnitLabel()}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary/70 px-3 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}

export function AnalysisFeatureSummary({
  summary,
}: {
  summary?: AnalyticsFeatureSummary;
}) {
  const { t } = useTranslation();

  if (!summary) return null;

  const hasData =
    summary.debts.total > 0 ||
    summary.installments.totalPlans > 0 ||
    summary.checks.pendingCount > 0 ||
    summary.checks.clearedCount > 0 ||
    summary.projects.total > 0 ||
    summary.partners.total > 0;

  return (
    <section className="glass space-y-4 rounded-2xl p-4 lg:p-5" data-tour="analysis-features">
      <div>
        <h2 className="text-lg font-bold lg:text-xl">
          {t("pages.analysis.featureSummaryTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t("pages.analysis.featureSummaryDescription")}
        </p>
      </div>

      {!hasData ? (
        <p className="rounded-xl bg-surface-secondary/60 px-4 py-5 text-center text-sm text-muted">
          {t("pages.analysis.noFeatureData")}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="space-y-2 rounded-2xl border border-border/60 bg-surface/60 p-4">
            <h3 className="font-semibold">{t("pages.analysis.debtsSummary")}</h3>
            <Stat label={t("pages.analysis.receivableRemaining")}>
              <Amount value={summary.debts.receivableRemaining} />
            </Stat>
            <Stat label={t("pages.analysis.payableRemaining")}>
              <Amount value={summary.debts.payableRemaining} />
            </Stat>
            <p className="text-xs text-muted">
              {toPersianDigits(summary.debts.openCount)} {t("pages.debts.filterOpen")} · {toPersianDigits(summary.debts.settledCount)} {t("pages.debts.filterSettled")}
            </p>
          </article>

          <article className="space-y-2 rounded-2xl border border-border/60 bg-surface/60 p-4">
            <h3 className="font-semibold">{t("pages.analysis.installmentsSummary")}</h3>
            <Stat label={t("pages.analysis.dueInstallments")}>
              <span>{toPersianDigits(summary.installments.dueCount)} · <Amount value={summary.installments.dueAmount} /></span>
            </Stat>
            <Stat label={t("pages.analysis.paidInstallments")}>
              <span>{toPersianDigits(summary.installments.paidCount)} · <Amount value={summary.installments.paidAmount} /></span>
            </Stat>
            <p className="text-xs text-muted">
              {toPersianDigits(summary.installments.activePlans)} / {toPersianDigits(summary.installments.totalPlans)} {t("pages.planning.installmentActive")}
            </p>
          </article>

          <article className="space-y-2 rounded-2xl border border-border/60 bg-surface/60 p-4">
            <h3 className="font-semibold">{t("pages.analysis.checksSummary")}</h3>
            <Stat label={t("pages.analysis.pendingChecks")}>
              <span>{toPersianDigits(summary.checks.pendingCount)} · <Amount value={summary.checks.pendingAmount} /></span>
            </Stat>
            <Stat label={t("pages.analysis.clearedChecks")}>
              {toPersianDigits(summary.checks.clearedCount)}
            </Stat>
            <p className="text-xs text-muted">
              {t("pages.planning.checkIncoming")}: <Amount value={summary.checks.receivablePendingAmount} /> · {t("pages.planning.checkOutgoing")}: <Amount value={summary.checks.payablePendingAmount} />
            </p>
          </article>

          <article className="space-y-2 rounded-2xl border border-border/60 bg-surface/60 p-4">
            <h3 className="font-semibold">{t("pages.analysis.projectsSummary")} و {t("pages.analysis.partnersSummary")}</h3>
            <Stat label={t("pages.analysis.activeProjects")}>
              {toPersianDigits(summary.projects.active)} / {toPersianDigits(summary.projects.total)}
            </Stat>
            <Stat label={t("pages.analysis.activePartners")}>
              {toPersianDigits(summary.partners.active)} / {toPersianDigits(summary.partners.total)}
            </Stat>
            <p className="text-xs text-muted">
              {toPersianDigits(summary.partners.sharePercentTotal.toFixed(1))}{t("common.percentSign")} {t("pages.partners.totalShareLabel")}
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
