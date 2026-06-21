"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Chart } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { IWorkTimeReport } from "@/common/interfaces/work-time.interface";
import {
  formatDurationMinutes,
  formatPrice,
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
  onAlertAction?: (alert: import("@/common/interfaces/work-time.interface").IWorkTimeAlert) => void;
};

export function WorkTimeAnalysisSection({
  report,
  alerts,
  compact = false,
  onAlertAction,
}: WorkTimeAnalysisSectionProps) {
  const progress =
    report.globalTargetMinutes && report.globalTargetMinutes > 0
      ? Math.min(
          (report.globalWorkedMinutes / report.globalTargetMinutes) * 100,
          100,
        )
      : null;

  return (
    <section className="space-y-4">
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted">تحلیل ساعات کاری</p>
            <h2 className="text-xl font-bold">{report.periodLabel}</h2>
          </div>
          <Link href={PATHS.WORK_ATTENDANCE}>
            <Button size="sm" variant="secondary">
              <Chart size={16} />
              حضور و غیاب
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">کارکرد ماه</p>
          <p className="mt-2 text-xl font-bold">
            {formatDurationMinutes(report.globalWorkedMinutes)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">ساعت موظف</p>
          <p className="mt-2 text-xl font-bold">
            {report.globalTargetMinutes
              ? formatDurationMinutes(report.globalTargetMinutes)
              : "—"}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">پیشرفت</p>
          <p className="mt-2 text-xl font-bold">
            {progress !== null ? `${toPersianDigits(String(Math.round(progress)))}٪` : "—"}
          </p>
        </div>
      </div>

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
          <p className="font-semibold">مقایسه با ماه قبل</p>
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

      {report.projectAnalysis.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {report.projectAnalysis.slice(0, 6).map((row) => (
            <article key={row.projectId} className="glass rounded-2xl p-4 text-sm">
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
              {row.incomePerHour ? (
                <p className="mt-1 font-medium text-income">
                  {formatPrice(row.incomePerHour)} / ساعت
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <WorkTimeAnalysisCharts report={report} />
    </section>
  );
}
