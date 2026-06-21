"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  ArrowLeft2,
  ArrowRight2,
  Clock,
  DocumentDownload,
  Login,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as workTimeApi from "@/common/api/work-time";
import type {
  IWorkTimeAlert,
  IWorkTimeDashboard,
  IWorkTimeReport,
} from "@/common/interfaces/work-time.interface";
import {
  formatDurationMinutes,
  formatDurationShort,
  formatJalaliMonthYear,
  getJalaliDaysInMonth,
  getJalaliNow,
  toPersianDigits,
} from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { WorkTimeAnalysisSection } from "@/components/pages/projects/WorkTimeAnalysisSection";
import { WorkTimeInsightsPanels } from "@/components/pages/projects/WorkTimeInsightsPanels";
import { moment } from "@/common/utils/jalali-date";

export function WorkAttendancePage() {
  const now = getJalaliNow();
  const [year, setYear] = useState(now.jYear());
  const [month, setMonth] = useState(now.jMonth() + 1);
  const [data, setData] = useState<IWorkTimeDashboard | null>(null);
  const [report, setReport] = useState<IWorkTimeReport | null>(null);
  const [alerts, setAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, workReport, workAlerts] = await Promise.all([
        workTimeApi.fetchWorkTimeDashboard(year, month),
        workTimeApi.fetchWorkTimeReport(year, month),
        workTimeApi.fetchWorkTimeAlerts(year, month),
      ]);
      setData(dashboard);
      setReport(workReport);
      setAlerts(workAlerts);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const daysInMonth = useMemo(() => getJalaliDaysInMonth(year, month), [year, month]);

  const dailyMap = useMemo(() => {
    const map = new Map<number, number>();
    data?.dailyTotals.forEach((row) => map.set(row.day, row.minutes));
    return map;
  }, [data?.dailyTotals]);

  function shiftMonth(offset: number) {
    const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(offset, "jMonth");
    setYear(date.jYear());
    setMonth(date.jMonth() + 1);
    setSelectedDay(null);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await workTimeApi.exportWorkTimeExcel(year, month);
      workTimeApi.downloadWorkTimeExport(blob, year, month);
      showToast("فایل اکسل دانلود شد", "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setExporting(false);
    }
  }

  async function handleAlertAction(alert: IWorkTimeAlert) {
    if (alert.action === "clock-out" && alert.projectId) {
      try {
        await workTimeApi.clockOut(alert.projectId);
        showToast("خروج ثبت شد", "success");
        await load();
      } catch (err) {
        showErrorToast(err);
      }
    }
  }

  const aggregatedProgress =
    data?.globalTarget.requiredMinutes && data.globalTarget.requiredMinutes > 0
      ? Math.min(
          (data.globalTarget.workedMinutes / data.globalTarget.requiredMinutes) * 100,
          100,
        )
      : null;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">نمای کلی</p>
        <h1 className="mt-1 text-2xl font-bold">تحلیل حضور و غیاب</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          فقط پروژه‌هایی که ثبت ساعت کاری‌شان را روشن کرده‌اید اینجا می‌آیند. ساعت
          موظف هر پروژه را در صفحه حضور و غیاب همان پروژه تعریف کنید.
        </p>
        <Link
          href={PATHS.PROJECTS}
          className="mt-3 inline-flex text-sm font-medium text-white/90 underline-offset-2 hover:underline"
        >
          بازگشت به پروژه‌ها
        </Link>
      </section>

      <div className="glass flex items-center justify-between rounded-2xl p-3">
        <Button isIconOnly variant="ghost" onPress={() => shiftMonth(-1)}>
          <ArrowRight2 size={18} />
        </Button>
        <p className="font-semibold">
          {formatJalaliMonthYear(String(year), String(month))}
        </p>
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => void handleExport()}
            isPending={exporting}
            aria-label="خروجی اکسل"
          >
            <DocumentDownload size={18} />
          </Button>
          <Button isIconOnly variant="ghost" onPress={() => shiftMonth(1)}>
            <ArrowLeft2 size={18} />
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
      ) : (
        <>
          {alerts.length > 0 ? (
            <WorkTimeInsightsPanels
              alerts={alerts}
              insights={[]}
              onAlertAction={(alert) => void handleAlertAction(alert)}
            />
          ) : null}

          <section className="glass rounded-2xl p-4 text-sm">
            <p>
              کارکرد این ماه (همه پروژه‌های فعال):{" "}
              <span className="font-bold">
                {formatDurationMinutes(data.globalTarget.workedMinutes)}
              </span>
            </p>
            {data.globalTarget.requiredMinutes ? (
              <p className="mt-1 text-muted">
                جمع ساعت موظف پروژه‌ها:{" "}
                {formatDurationMinutes(data.globalTarget.requiredMinutes)}
                {aggregatedProgress !== null
                  ? ` · ${toPersianDigits(String(Math.round(aggregatedProgress)))}٪`
                  : ""}
              </p>
            ) : null}
            {aggregatedProgress !== null ? (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${aggregatedProgress}%` }}
                />
              </div>
            ) : null}
          </section>

          {data.activeSession ? (
            <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
              <p className="text-sm font-medium text-accent">جلسه باز</p>
              <p className="mt-1 text-xs text-muted">
                یک پروژه در حال ثبت زمان است — برای پایان، از صفحه حضور و غیاب همان پروژه خروج بزنید.
              </p>
              {data.activeSession.project ? (
                <Link
                  href={PATHS.PROJECT_ATTENDANCE(String(data.activeSession.project))}
                  className="mt-3 inline-block"
                >
                  <Button size="sm" variant="secondary">
                    رفتن به حضور و غیاب پروژه
                  </Button>
                </Link>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted">پروژه‌های با ثبت ساعت</h2>
            {data.projects.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted">
                هیچ پروژه‌ای برای ثبت ساعت فعال نیست — از تنظیمات پروژه، «ثبت ساعت کاری» را روشن کنید.
              </div>
            ) : (
              data.projects.map((row) => {
                const title = row.project.category?.title ?? "بدون عنوان";
                const isActive = Boolean(row.activeSession);
                const progress =
                  row.monthTargetMinutes && row.monthTargetMinutes > 0
                    ? Math.min(
                        (row.monthWorkedMinutes / row.monthTargetMinutes) * 100,
                        100,
                      )
                    : null;

                return (
                  <article key={row.project._id} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold">{title}</h3>
                          {row.project.fixedIncome ? (
                            <span className="rounded-lg bg-income-soft px-2 py-0.5 text-xs font-medium text-income">
                              درآمد ثابت
                            </span>
                          ) : (
                            <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                              ساعتی / قراردادی
                            </span>
                          )}
                          {isActive ? (
                            <span className="rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                              در حال کار
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          این ماه: {formatDurationMinutes(row.monthWorkedMinutes)}
                          {row.monthTargetMinutes
                            ? ` از ${formatDurationMinutes(row.monthTargetMinutes)}`
                            : ""}
                        </p>
                      </div>
                      <Clock size={22} className="shrink-0 text-accent" />
                    </div>

                    {progress !== null ? (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={PATHS.PROJECT_ATTENDANCE(row.project._id)}>
                        <Button className="bg-income text-white">
                          <Login size={16} />
                          حضور و غیاب پروژه
                        </Button>
                      </Link>
                      <Link href={PATHS.PROJECT(row.project._id)}>
                        <Button variant="ghost" size="sm">
                          جزئیات پروژه
                        </Button>
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="glass space-y-3 rounded-2xl p-4">
            <h2 className="font-semibold">تقویم کارکرد ماه</h2>
            <p className="text-xs text-muted">
              روی هر روز بزنید تا جزئیات را ببینید — مجموع پروژه‌های فعال
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const minutes = dailyMap.get(day) ?? 0;
                const isSelected = selectedDay === day;
                const isToday =
                  day === now.jDate() &&
                  month === now.jMonth() + 1 &&
                  year === now.jYear();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`cursor-pointer rounded-xl p-2 text-center transition ${
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : minutes > 0
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-surface-secondary text-muted"
                    } ${isToday ? "ring-2 ring-accent/50" : ""}`}
                  >
                    <p className="text-sm font-semibold">{toPersianDigits(String(day))}</p>
                    {minutes > 0 ? (
                      <p className="mt-0.5 text-[10px]">{formatDurationShort(minutes)}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {selectedDay ? (
              <p className="rounded-xl bg-surface-secondary p-3 text-sm">
                روز {toPersianDigits(String(selectedDay))}:{" "}
                <span className="font-semibold">
                  {formatDurationMinutes(dailyMap.get(selectedDay) ?? 0)}
                </span>
              </p>
            ) : null}
          </section>

          {report ? (
            <WorkTimeAnalysisSection
              report={report}
              alerts={[]}
              scope="global"
              onAlertAction={(alert) => void handleAlertAction(alert)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
