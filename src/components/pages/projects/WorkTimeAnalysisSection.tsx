"use client";

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
        در حال رسم نمودار کارکرد…
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
              {isProjectScope ? "تحلیل کارکرد پروژه" : "تحلیل ساعات کاری"}
            </p>
            <h2 className="text-xl font-bold">
              {isProjectScope ? title : report.periodLabel}
            </h2>
          </div>
          {isProjectScope && report.projectId ? (
            <Link href={PATHS.WORK_ATTENDANCE}>
              <Button size="sm" variant="secondary">
                <Chart size={16} />
                همه پروژه‌ها
              </Button>
            </Link>
          ) : (
            <Link href={PATHS.WORK_ATTENDANCE}>
              <Button size="sm" variant="secondary">
                <Chart size={16} />
                حضور و غیاب
              </Button>
            </Link>
          )}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? "کارکرد این پروژه" : "کارکرد ماه"}
          </p>
          <p className="mt-2 text-xl font-bold">
            {formatDurationMinutes(report.globalWorkedMinutes)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? "ساعت موظف پروژه" : "جمع ساعت موظف پروژه‌ها"}
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
            {progress !== null ? `${toPersianDigits(String(Math.round(progress)))}٪` : "—"}
          </p>
        </div>
      </div>

      {totalExpectedEarnings > 0 ? (
        <section className="glass rounded-2xl border border-income/30 bg-income-soft/20 p-4">
          <p className="text-sm text-muted">
            {isProjectScope ? "مبلغ قابل دریافت این ماه" : "مجموع مبلغ قابل دریافت (پروژه‌های ساعتی)"}
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
              کارکرد ماه قبل:{" "}
              <span className="font-medium">
                {formatDurationMinutes(report.comparison.previousWorkedMinutes)}
              </span>
            </p>
            <p>
              تغییر کارکرد:{" "}
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
                )}
                ٪
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
                  {row.fixedIncome ? "ثابت" : "ساعتی"}
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
                  قابل دریافت: {formatPrice(row.expectedEarnings)}
                </p>
              ) : row.incomePerHour ? (
                <p className="mt-1 font-medium text-income">
                  {formatPrice(row.incomePerHour)} / ساعت (واقعی)
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
              {report.projectAnalysis[0].fixedIncome ? "ثابت" : "ساعتی"}
            </span>
          </div>
          <p className="mt-2 text-muted">
            {formatDurationMinutes(report.projectAnalysis[0].workedMinutes)}
            {report.projectAnalysis[0].targetMinutes
              ? ` / ${formatDurationMinutes(report.projectAnalysis[0].targetMinutes)}`
              : ""}
            {" · "}
            {formatCount(report.projectAnalysis[0].sessionCount)} جلسه
          </p>
          {report.projectAnalysis[0].hourlyRate ? (
            <p className="mt-1 text-muted">
              نرخ قرارداد: {formatPrice(report.projectAnalysis[0].hourlyRate)} / ساعت
            </p>
          ) : null}
          {report.projectAnalysis[0].expectedEarnings ? (
            <p className="mt-1 font-bold text-income">
              قابل دریافت این ماه: {formatPrice(report.projectAnalysis[0].expectedEarnings)}
            </p>
          ) : report.projectAnalysis[0].incomePerHour ? (
            <p className="mt-1 font-medium text-income">
              {formatPrice(report.projectAnalysis[0].incomePerHour)} / ساعت (واقعی)
            </p>
          ) : null}
        </article>
      ) : null}

      <WorkTimeAnalysisCharts report={report} scope={scope} />
    </section>
  );
}
