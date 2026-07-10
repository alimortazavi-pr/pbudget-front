"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  Add,
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  ArrowUp2,
  Chart,
  DocumentDownload,
  Login,
  Logout,
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
  formatJalaliMonthYear,
  getJalaliNow,
  toPersianDigits,
} from "@/common/utils";
import { WorkMonthCalendar } from "@/components/pages/projects/WorkMonthCalendar";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { WorkTimeAnalysisSection } from "@/components/pages/projects/WorkTimeAnalysisSection";
import { WorkTimeInsightsPanels } from "@/components/pages/projects/WorkTimeInsightsPanels";
import { QuickManualWorkSessionModal } from "@/components/pages/projects/QuickManualWorkSessionModal";
import {
  formatDailyRemainingMessage,
  useWorkSessionDailyReminder,
} from "@/common/hooks/useWorkSessionDailyReminder";
import { moment } from "@/common/utils/jalali-date";

type TabId = "today" | "all";

export function WorkAttendancePage() {
  const { t } = useTranslation();
  const now = getJalaliNow();
  const [year, setYear] = useState(now.jYear());
  const [month, setMonth] = useState(now.jMonth() + 1);
  const [tab, setTab] = useState<TabId>("today");
  const [data, setData] = useState<IWorkTimeDashboard | null>(null);
  const [report, setReport] = useState<IWorkTimeReport | null>(null);
  const [alerts, setAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

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

  const dailyMap = useMemo(() => {
    const map = new Map<number, number>();
    data?.dailyTotals.forEach((row) => map.set(row.day, row.minutes));
    return map;
  }, [data?.dailyTotals]);

  const activeProjectId = data?.activeSession?.project
    ? String(data.activeSession.project)
    : null;

  const activeProjectTitle = useMemo(() => {
    if (!activeProjectId || !data) return null;
    const row = data.projects.find((item) => item.project._id === activeProjectId);
    return row?.project.category?.title ?? "پروژه";
  }, [activeProjectId, data]);

  useWorkSessionDailyReminder({
    dailyStatus: data?.activeSessionDailyStatus,
    projectTitle: activeProjectTitle ?? undefined,
  });

  const visibleProjects = useMemo(() => {
    if (!data) return [];
    const showSynced = typeof window !== "undefined" && localStorage.getItem("pbudget_show_synced_projects") !== "false";
    let list = data.projects;
    if (!showSynced) {
      list = list.filter((row) => !row.project.description?.includes("Synced from Business"));
    }
    if (tab === "today") {
      return list.filter(
        (row) => row.activeSession || row.dailyStatus?.isWorkingDay !== false,
      );
    }
    return list;
  }, [data, tab]);

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
      showToast(t("فایل اکسل دانلود شد"), "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setExporting(false);
    }
  }

  async function handleClockIn(projectId: string) {
    setActionProjectId(projectId);
    try {
      const result = await workTimeApi.clockIn(projectId);
      const msg = formatDailyRemainingMessage(result.dailyStatus);
      showToast(msg ? `ورود ثبت شد · ${msg}` : "ورود ثبت شد", "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setActionProjectId(null);
    }
  }

  async function handleClockOut(projectId: string) {
    setActionProjectId(projectId);
    try {
      await workTimeApi.clockOut(projectId);
      showToast(t("خروج ثبت شد"), "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setActionProjectId(null);
    }
  }

  async function handleAlertAction(alert: IWorkTimeAlert) {
    if (alert.action === "clock-out" && alert.projectId) {
      await handleClockOut(alert.projectId);
    }
  }

  const aggregatedProgress =
    data?.globalTarget.requiredMinutes && data.globalTarget.requiredMinutes > 0
      ? Math.min(
          (data.globalTarget.workedMinutes / data.globalTarget.requiredMinutes) * 100,
          100,
        )
      : null;

  const workingDays = data?.workingDays;
  const dailyPerProject = data?.globalTarget.requiredDailyMinutes;
  const monthTarget = data?.globalTarget.requiredMinutes;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">{t("پروژه‌ها")}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("حضور و غیاب")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          ساعت روزانه را برای هر پروژه تعریف کنید — هدف ماه با احتساب جمعه و تعطیلات
          رسمی محاسبه می‌شود.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "today" as const, label: "امروز" },
          { id: "all" as const, label: "همه پروژه‌ها" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

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
            aria-label={t("خروجی اکسل")}
          >
            <DocumentDownload size={18} />
          </Button>
          <Button isIconOnly variant="ghost" onPress={() => shiftMonth(1)}>
            <ArrowLeft2 size={18} />
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("در حال بارگذاری…")}</div>
      ) : (
        <>
          {alerts.length > 0 ? (
            <WorkTimeInsightsPanels
              alerts={alerts}
              insights={[]}
              onAlertAction={(alert) => void handleAlertAction(alert)}
            />
          ) : null}

          {activeProjectId && activeProjectTitle ? (
            <section className="rounded-2xl border-2 border-accent/50 bg-accent/10 p-4">
              <p className="text-sm font-medium text-accent">{t("در حال کار")}</p>
              <p className="mt-1 font-bold">{activeProjectTitle}</p>
              {data.activeSessionDailyStatus ? (
                <p className="mt-1 text-xs text-muted">
                  {formatDailyRemainingMessage(data.activeSessionDailyStatus)}
                </p>
              ) : null}
              <Button
                className="mt-3 bg-expense text-white"
                onPress={() => void handleClockOut(activeProjectId)}
                isPending={actionProjectId === activeProjectId}
              >
                <Logout size={16} />
                خروج
              </Button>
            </section>
          ) : null}

          <section className="glass rounded-2xl p-4 text-sm">
            {workingDays ? (
              <p className="text-muted">
                {toPersianDigits(String(workingDays.inMonth))} روز کاری این ماه (
                {toPersianDigits(String(workingDays.fridayCount))} جمعه +{" "}
                {toPersianDigits(String(workingDays.holidayCount))} تعطیل رسمی)
              </p>
            ) : null}
            {dailyPerProject && monthTarget ? (
              <>
                <p className="mt-2">
                  جمع ساعت روزانه پروژه‌ها:{" "}
                  <span className="font-bold">{formatDurationMinutes(dailyPerProject)}</span>
                  {" · "}
                  هدف این ماه:{" "}
                  <span className="font-bold text-accent">
                    {formatDurationMinutes(monthTarget)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDurationMinutes(dailyPerProject)} ×{" "}
                  {toPersianDigits(String(workingDays?.inMonth ?? "—"))} روز کاری
                </p>
              </>
            ) : (
              <p className="mt-2 text-muted">
                برای هر پروژه «ساعت روزانه» را در جزئیات تنظیم کنید.
              </p>
            )}
            <p className="mt-2">
              کارکرد این ماه:{" "}
              <span className="font-bold">
                {formatDurationMinutes(data.globalTarget.workedMinutes)}
              </span>
              {data.globalTarget.todayWorkedMinutes !== null ? (
                <>
                  {" · "}
                  امروز:{" "}
                  {formatDurationMinutes(data.globalTarget.todayWorkedMinutes)}
                </>
              ) : null}
            </p>
            {aggregatedProgress !== null ? (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${aggregatedProgress}%` }}
                />
              </div>
            ) : null}
          </section>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={() => setManualOpen(true)}>
              <Add size={16} />
              ثبت دستی
            </Button>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted">
              {tab === "today" ? "پروژه‌های امروز" : "پروژه‌ها"}
            </h2>
            {visibleProjects.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-muted">
                {tab === "today"
                  ? "امروز روز کاری نیست یا پروژه فعالی ندارید."
                  : "هیچ پروژه‌ای برای ثبت ساعت فعال نیست."}
              </div>
            ) : (
              visibleProjects.map((row) => {
                const projectId = row.project._id;
                const title = row.project.category?.title ?? "بدون عنوان";
                const isActive = Boolean(row.activeSession);
                const blockedByOtherSession =
                  Boolean(activeProjectId) && activeProjectId !== projectId;
                const progress =
                  row.monthTargetMinutes && row.monthTargetMinutes > 0
                    ? Math.min(
                        (row.monthWorkedMinutes / row.monthTargetMinutes) * 100,
                        100,
                      )
                    : null;

                return (
                  <article key={projectId} className="glass rounded-2xl p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold">{title}</h3>
                        {isActive ? (
                          <span className="rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                            در حال کار
                          </span>
                        ) : null}
                      </div>
                      {row.requiredDailyMinutes ? (
                        <p className="mt-1 text-sm text-muted">
                          روزانه {formatDurationMinutes(row.requiredDailyMinutes)}
                          {row.monthTargetMinutes
                            ? ` · این ماه ${formatDurationMinutes(row.monthTargetMinutes)}`
                            : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-warning">
                          ساعت روزانه تعریف نشده — از جزئیات تنظیم کنید
                        </p>
                      )}
                      <p className="mt-1 text-sm">
                        کارکرد ماه: {formatDurationMinutes(row.monthWorkedMinutes)}
                        {row.dailyStatus?.isWorkingDay && row.dailyStatus.workedTodayMinutes
                          ? ` · امروز ${formatDurationMinutes(row.dailyStatus.workedTodayMinutes)}`
                          : ""}
                      </p>
                    </div>

                    {progress !== null ? (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {isActive ? (
                        <Button
                          className="bg-expense text-white"
                          onPress={() => void handleClockOut(projectId)}
                          isPending={actionProjectId === projectId}
                        >
                          <Logout size={16} />
                          خروج
                        </Button>
                      ) : (
                        <Button
                          className="bg-income text-white"
                          onPress={() => void handleClockIn(projectId)}
                          isPending={actionProjectId === projectId}
                          isDisabled={blockedByOtherSession || row.dailyStatus?.isWorkingDay === false}
                        >
                          <Login size={16} />
                          ورود
                        </Button>
                      )}
                      <Link href={PATHS.PROJECT_ATTENDANCE(projectId)}>
                        <Button variant="secondary" size="sm">
                          جزئیات
                        </Button>
                      </Link>
                    </div>
                    {blockedByOtherSession ? (
                      <p className="mt-2 text-xs text-muted">
                        ابتدا از پروژه فعال خارج شوید.
                      </p>
                    ) : null}
                    {row.dailyStatus?.isWorkingDay === false ? (
                      <p className="mt-2 text-xs text-muted">{t("امروز روز کاری نیست.")}</p>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>

          <section className="glass overflow-hidden rounded-2xl">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 p-4 text-start"
              onClick={() => setShowAnalysis((open) => !open)}
            >
              <div className="flex items-center gap-2">
                <Chart size={18} className="text-accent" />
                <div>
                  <p className="font-semibold">{t("تحلیل و تقویم ماه")}</p>
                  <p className="text-xs text-muted">{t("نمودارها، تقویم و جزئیات کارکرد")}</p>
                </div>
              </div>
              {showAnalysis ? <ArrowUp2 size={18} /> : <ArrowDown2 size={18} />}
            </button>
            {showAnalysis ? (
              <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                <WorkMonthCalendar
                  year={year}
                  month={month}
                  dailyMap={dailyMap}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  hint="روزهای خاکستری: جمعه یا تعطیل رسمی"
                />
                {report ? (
                  <WorkTimeAnalysisSection
                    report={report}
                    alerts={[]}
                    scope="global"
                    onAlertAction={(alert) => void handleAlertAction(alert)}
                  />
                ) : null}
              </div>
            ) : null}
          </section>
        </>
      )}

      <QuickManualWorkSessionModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        projects={data?.projects.map((row) => row.project) ?? []}
        defaultYear={year}
        defaultMonth={month}
        defaultDay={now.jDate()}
        onSaved={() => void load()}
      />
    </div>
  );
}
