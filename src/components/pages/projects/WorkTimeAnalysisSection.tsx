"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Chart } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { IWorkTimeReport } from "@/common/interfaces/work-time.interface";
import {
  formatDurationMinutes,
  formatPrice,
  formatCount,
  toPersianDigits,
} from "@/common/utils";
import { WorkTimeInsightsPanels } from "@/components/pages/projects/WorkTimeInsightsPanels";

const WorkTimeAnalysisCharts = dynamic(
  () =>
    import("@/components/pages/projects/WorkTimeAnalysisCharts").then(
      (mod) => mod.WorkTimeAnalysisCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        {t("auto.k19118a5220")}
      </div>
    ),
  },
);

type WorkTimeAnalysisSectionProps = {
  report: IWorkTimeReport;
  alerts: import("@/common/interfaces/work-time.interface").IWorkTimeAlert[];
  compact?: boolean;
  scope?: "global" | "project";
  onAlertAction?: (alert: import("@/common/interfaces/work-time.interface").IWorkTimeAlert) => void;
};

export function WorkTimeAnalysisSection({
  report,
  alerts,
  compact = false,
  scope = "global",
  onAlertAction,
}: WorkTimeAnalysisSectionProps) {
  const { t } = useTranslation();
  const progress =
    report.globalTargetMinutes && report.globalTargetMinutes > 0
      ? Math.min(
          (report.globalWorkedMinutes / report.globalTargetMinutes) * 100,
          100,
        )
      : null;

  const totalExpectedEarnings = report.projectAnalysis.reduce(
    (sum, row) => sum + (row.expectedEarnings ?? 0),
    0,
  );

  const isProjectScope = scope === "project";
  const title = report.projectTitle ?? report.periodLabel;

  return (
    <section className="space-y-4">
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted">
              {isProjectScope ? t("auto.kd7f847d82d") : t("auto.k260712053e")}
            </p>
            <h2 className="text-xl font-bold">
              {isProjectScope ? title : report.periodLabel}
            </h2>
          </div>
          {isProjectScope && report.projectId ? (
            <Link href={PATHS.WORK_ATTENDANCE}>
              <Button size="sm" variant="secondary">
                <Chart size={16} />
                {t("auto.kfbf6ce5da9")}
              </Button>
            </Link>
          ) : (
            <Link href={PATHS.WORK_ATTENDANCE}>
              <Button size="sm" variant="secondary">
                <Chart size={16} />
                {t("auto.ka4b30b68b9")}
              </Button>
            </Link>
          )}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? t("auto.kdfb6f79e1b") : t("auto.kd60d9ee341")}
          </p>
          <p className="mt-2 text-xl font-bold">
            {formatDurationMinutes(report.globalWorkedMinutes)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? t("auto.k7c1c655eb4") : t("auto.k5bd01ff123")}
          </p>
          <p className="mt-2 text-xl font-bold">
            {report.globalTargetMinutes
              ? formatDurationMinutes(report.globalTargetMinutes)
              : "—"}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">{t("auto.k9998d1625f")}</p>
          <p className="mt-2 text-xl font-bold">
            {progress !== null ? `${toPersianDigits(String(Math.round(progress)))} ${t("auto.ka367d4888a")}` : "—"}
          </p>
        </div>
      </div>

      {totalExpectedEarnings > 0 ? (
        <section className="glass rounded-2xl border border-income/30 bg-income-soft/20 p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? t("auto.k217a135afe") : t("auto.k5dfcba3e85")}
          </p>
          <p className="mt-2 text-2xl font-bold text-income">
            {formatPrice(totalExpectedEarnings)}
          </p>
        </section>
      ) : null}

      {progress !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {report.comparison ? (
        <section className="glass rounded-2xl border border-border/50 p-4 text-sm">
          <p className="font-semibold">{t("auto.k363efa810f")}</p>
          <p className="mt-1 text-muted">{report.comparison.previousPeriodLabel}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p>
              {t("auto.k55db9db302")}{" "}
              <span className="font-medium">
                {formatDurationMinutes(report.comparison.previousWorkedMinutes)}
              </span>
            </p>
            <p>
              {t("auto.kf201f6dff1")}{" "}
              <span
                className={`font-medium ${
                  report.comparison.workedChangePercent >= 0
                    ? "text-income"
                    : "text-expense"
                }`}
              >
                {report.comparison.workedChangePercent >= 0 ? "+" : ""}
                {toPersianDigits(
                  String(Math.round(report.comparison.workedChangePercent)),
                )} {t("auto.ka367d4888a")}
              </span>
            </p>
          </div>
        </section>
      ) : null}

      <WorkTimeInsightsPanels
        alerts={alerts}
        insights={report.insights}
        onAlertAction={onAlertAction}
      />

      {report.projectAnalysis.length > 0 && !isProjectScope ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {report.projectAnalysis.slice(0, 6).map((row) => (
            <Link
              key={row.projectId}
              href={PATHS.PROJECT_ATTENDANCE(row.projectId)}
              className="block glass rounded-2xl p-4 text-sm transition hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{row.title}</p>
                <span className="text-xs text-muted">
                  {row.fixedIncome ? t("auto.kb14512e064") : t("auto.k83c2233449")}
                </span>
              </div>
              <p className="mt-2 text-muted">
                {formatDurationMinutes(row.workedMinutes)}
                {row.targetMinutes
                  ? ` / ${formatDurationMinutes(row.targetMinutes)}`
                  : ""}
              </p>
              {row.expectedEarnings ? (
                <p className="mt-1 font-bold text-income">
                  {t("auto.ka2ca848a0e")}{formatPrice(row.expectedEarnings)}
                </p>
              ) : row.incomePerHour ? (
                <p className="mt-1 font-medium text-income">
                  {t("projects.incomePerHourLine", {
                    amount: formatPrice(row.incomePerHour),
                  })}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}

      {isProjectScope && report.projectAnalysis[0] ? (
        <article className="glass rounded-2xl p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{report.projectAnalysis[0].title}</p>
            <span className="text-xs text-muted">
              {report.projectAnalysis[0].fixedIncome ? t("auto.kb14512e064") : t("auto.k83c2233449")}
            </span>
          </div>
          <p className="mt-2 text-muted">
            {formatDurationMinutes(report.projectAnalysis[0].workedMinutes)}
            {report.projectAnalysis[0].targetMinutes
              ? ` / ${formatDurationMinutes(report.projectAnalysis[0].targetMinutes)}`
              : ""}
            {" · "}
            {formatCount(report.projectAnalysis[0].sessionCount)} {t("auto.kc7a5581bde")}
          </p>
          {report.projectAnalysis[0].hourlyRate ? (
            <p className="mt-1 text-muted">
              {t("projects.contractRateLine", {
                amount: formatPrice(report.projectAnalysis[0].hourlyRate),
              })}
            </p>
          ) : null}
          {report.projectAnalysis[0].expectedEarnings ? (
            <p className="mt-1 font-bold text-income">
              {t("auto.k337158536f")}{formatPrice(report.projectAnalysis[0].expectedEarnings)}
            </p>
          ) : report.projectAnalysis[0].incomePerHour ? (
            <p className="mt-1 font-medium text-income">
              {t("projects.incomePerHourLine", {
                amount: formatPrice(report.projectAnalysis[0].incomePerHour),
              })}
            </p>
          ) : null}
        </article>
      ) : null}

      <WorkTimeAnalysisCharts report={report} scope={scope} />
    </section>
  );
}
