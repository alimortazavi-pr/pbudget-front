"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  Add,
  ArrowLeft2,
  ArrowRight2,
  Clock,
  Edit2,
  Login,
  Logout,
  Setting2,
  Trash,
  Wallet,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import * as workTimeApi from "@/common/api/work-time";
import type {
  IProjectWorkSessions,
  IWorkSession,
  IWorkTimeAlert,
  IWorkTimeReport,
} from "@/common/interfaces/work-time.interface";
import { WorkMonthCalendar } from "@/components/pages/projects/WorkMonthCalendar";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import {
  formatDurationMinutes,
  formatJalaliMonthYear,
  formatPrice,
  getJalaliNow,
  hoursInputToMinutes,
  minutesToHoursInput,
  toEnglishDigits,
  toPersianDigits,
} from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { isBusinessSyncedProject } from "@/common/utils/business-sync";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
import {
  formatDailyRemainingMessage,
  useWorkSessionDailyReminder,
} from "@/common/hooks/useWorkSessionDailyReminder";
import { FormInput } from "@/components/common/form/FormFields";
import {
  formatSessionRange,
  ManualWorkSessionModal,
} from "@/components/pages/projects/ManualWorkSessionModal";
import { WorkTimeAnalysisSection } from "@/components/pages/projects/WorkTimeAnalysisSection";
import { WorkTimeInsightsPanels } from "@/components/pages/projects/WorkTimeInsightsPanels";
import { moment } from "@/common/utils/jalali-date";
import type { IBudget } from "@/common/interfaces/budget.interface";

type ProjectAttendancePageProps = {
  projectId: string;
};

export function ProjectAttendancePage({ projectId }: ProjectAttendancePageProps) {
  const { t } = useTranslation();
  const now = getJalaliNow();
  const [year, setYear] = useState(now.jYear());
  const [month, setMonth] = useState(now.jMonth() + 1);
  const [projectTitle, setProjectTitle] = useState(() => t("pages.attendance.defaultProject"));
  const [fixedIncome, setFixedIncome] = useState(false);
  const [trackWorkTime, setTrackWorkTime] = useState(false);
  const [businessSynced, setBusinessSynced] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [data, setData] = useState<IProjectWorkSessions | null>(null);
  const [report, setReport] = useState<IWorkTimeReport | null>(null);
  const [alerts, setAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<IWorkSession | null>(null);
  const [targetHours, setTargetHours] = useState("");
  const [savedMonthTarget, setSavedMonthTarget] = useState<number | null>(null);
  const [workingDaysInMonth, setWorkingDaysInMonth] = useState(0);
  const [savingTarget, setSavingTarget] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [targetSectionEl, setTargetSectionEl] = useState<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const projectDetail = await projectsApi.fetchProject(projectId);
      setProjectTitle(projectDetail.project.category?.title ?? t("pages.attendance.defaultProject"));
      setFixedIncome(projectDetail.project.fixedIncome ?? false);
      setTrackWorkTime(projectDetail.project.trackWorkTime === true);
      setBusinessSynced(isBusinessSyncedProject(projectDetail.project));
      setHourlyRate(projectDetail.project.hourlyRate ?? 0);

      if (projectDetail.project.trackWorkTime !== true) {
        setData(null);
        setReport(null);
        setAlerts([]);
        return;
      }

      const [sessions, workReport, workAlerts] = await Promise.all([
        workTimeApi.fetchProjectWorkSessions(projectId, year, month),
        workTimeApi.fetchProjectWorkTimeReport(projectId, year, month),
        workTimeApi.fetchProjectWorkTimeAlerts(projectId, year, month),
      ]);
      setData(sessions);
      setReport(workReport);
      setAlerts(workAlerts);
      setTargetHours(
        sessions.requiredDailyMinutes
          ? minutesToHoursInput(sessions.requiredDailyMinutes)
          : "",
      );
      setSavedMonthTarget(sessions.monthTargetMinutes);
      setWorkingDaysInMonth(sessions.workingDaysInMonth);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.attendance.loadError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, year, month, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!businessSynced) return;
    const timer = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [businessSynced, load]);

  const dailyMap = useMemo(() => {
    const map = new Map<number, number>();
    data?.dailyTotals.forEach((row) => map.set(row.day, row.minutes));
    return map;
  }, [data?.dailyTotals]);

  const progress = useMemo(() => {
    if (!data?.monthTargetMinutes || data.monthTargetMinutes <= 0) return null;
    return Math.min((data.monthWorkedMinutes / data.monthTargetMinutes) * 100, 100);
  }, [data]);

  function shiftMonth(offset: number) {
    const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(offset, "jMonth");
    setYear(date.jYear());
    setMonth(date.jMonth() + 1);
    setSelectedDay(null);
  }

  async function handleClockIn() {
    setActionLoading(true);
    try {
      const result = await workTimeApi.clockIn(projectId);
      const msg = formatDailyRemainingMessage(result.dailyStatus);
      showToast(msg ? `${t("pages.attendance.clockInRecorded")} · ${msg}` : t("pages.attendance.clockInRecorded"), "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClockOut() {
    setActionLoading(true);
    try {
      await workTimeApi.clockOut(projectId);
      showToast(t("projects.clockOutRecorded"), "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function saveTarget() {
    const minutes = hoursInputToMinutes(toEnglishDigits(targetHours));
    if (!minutes) {
      showToast(t("auto.k0a897a8d3c"));
      return;
    }
    setSavingTarget(true);
    try {
      const result = await workTimeApi.upsertMonthlyTarget({
        year,
        month,
        requiredDailyMinutes: minutes,
        projectId,
      });
      setSavedMonthTarget(result.monthTargetMinutes);
      setWorkingDaysInMonth(result.workingDaysInMonth);
      showToast(t("auto.k2bc89de926"), "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSavingTarget(false);
    }
  }

  async function removeSession(session: IWorkSession) {
    if (!confirm(t("pages.attendance.deleteRowConfirm"))) return;
    try {
      await workTimeApi.deleteWorkSession(projectId, session._id);
      showToast(t("common.deleted"), "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function handleAlertAction(alert: IWorkTimeAlert) {
    if (alert.action === "clock-out") {
      setActionLoading(true);
      try {
        await workTimeApi.clockOut(projectId);
        showToast(t("projects.clockOutRecorded"), "success");
        await load();
      } catch (err) {
        showErrorToast(err);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (alert.action === "set-target") {
      targetSectionEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function budgetLabel(budget: IBudget | string | undefined) {
    if (!budget || typeof budget === "string") return null;
    return budget.description || t("pages.attendance.relatedTransaction");
  }

  const expectedEarnings = useMemo(() => {
    if (!hourlyRate || !data?.monthWorkedMinutes) return null;
    return Math.round((data.monthWorkedMinutes / 60) * hourlyRate);
  }, [hourlyRate, data?.monthWorkedMinutes]);

  const isActive = Boolean(data?.activeSession);

  useWorkSessionDailyReminder({
    dailyStatus: data?.dailyStatus,
    projectTitle,
  });

  if (!loading && !trackWorkTime) {
    return (
      <div className="space-y-5 pb-6">
        <PageHeroSection
          variant="slate"
          title={projectTitle}
          description={t("pageHero.projectAttendance.disabledDescription")}
          footer={
            <Link
              href={PATHS.PROJECT(projectId)}
              className="mt-3 inline-flex text-sm font-medium text-white/90 underline-offset-2 hover:underline"
            >
              {t("pageHero.shared.backToProject")}
            </Link>
          }
        />
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {t("pageHero.shared.enableTimeTrackingHint")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeroSection
        variant="emerald"
        eyebrow={t("pageHero.projectAttendance.eyebrow")}
        title={projectTitle}
        description={t("pageHero.projectAttendance.description")}
        footer={
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link
              href={PATHS.PROJECT(projectId)}
              className="font-medium text-white/90 underline-offset-2 hover:underline"
            >
              {t("pageHero.shared.backToProject")}
            </Link>
            <Link
              href={PATHS.WORK_ATTENDANCE}
              className="font-medium text-white/90 underline-offset-2 hover:underline"
            >
              {t("pageHero.shared.allProjectsLink")}
            </Link>
          </div>
        }
      />

      <div className="glass flex items-center justify-between rounded-2xl p-3">
        <Button isIconOnly variant="ghost" onPress={() => shiftMonth(-1)}>
          <ArrowRight2 size={18} />
        </Button>
        <p className="font-semibold">
          {formatJalaliMonthYear(String(year), String(month))}
        </p>
        <Button isIconOnly variant="ghost" onPress={() => shiftMonth(1)}>
          <ArrowLeft2 size={18} />
        </Button>
      </div>

      {loading || !data ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
      ) : (
        <>
          {alerts.length > 0 ? (
            <WorkTimeInsightsPanels
              alerts={alerts}
              insights={[]}
              onAlertAction={(alert) => void handleAlertAction(alert)}
            />
          ) : null}

          <section className="glass space-y-3 rounded-2xl p-4">
            <p className="text-sm text-muted">
              {businessSynced
                ? t("pages.attendance.syncFromBusiness")
                : fixedIncome
                  ? t("pages.attendance.fixedIncomeHint")
                  : t("pages.attendance.hourlyHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {businessSynced ? (
                isActive ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-income/15 px-4 py-2 text-sm font-medium text-income">
                    <Login size={16} />
                    {t("auto.ke9b29d6c51")}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm text-muted">
                    <Logout size={16} />
                    {t("auto.k9fb2f268c0")}
                  </div>
                )
              ) : isActive ? (
                <Button
                  className="bg-expense text-white"
                  onPress={() => void handleClockOut()}
                  isPending={actionLoading}
                >
                  <Logout size={16} />
                  {t("common.logoutShort")}
                </Button>
              ) : (
                <Button
                  className="bg-income text-white"
                  onPress={() => void handleClockIn()}
                  isPending={actionLoading}
                >
                  <Login size={16} />
                  {t("auto.k32a81e5587")}
                </Button>
              )}
              {!businessSynced ? (
                <Button variant="secondary" onPress={() => setManualOpen(true)}>
                  <Add size={16} />
                  {t("auto.kbba3b5a823")}
                </Button>
              ) : null}
            </div>
            <div className="rounded-xl bg-surface-secondary p-3 text-sm">
              {t("auto.k0d7cdbf4fe")}{" "}
              <span className="font-bold">{formatDurationMinutes(data.monthWorkedMinutes)}</span>
              {data.monthTargetMinutes
                ? t("projects.monthTargetSuffix", {
                    duration: formatDurationMinutes(data.monthTargetMinutes),
                  })
                : ""}
              {data.dailyStatus?.workedTodayMinutes !== undefined ? (
                <>
                  {" · "} {t("auto.kaac7d1e045")} {formatDurationMinutes(data.dailyStatus.workedTodayMinutes)}
                </>
              ) : null}
            </div>
            {isActive && data.dailyStatus ? (
              <p className="text-xs text-muted">
                {formatDailyRemainingMessage(data.dailyStatus)}
              </p>
            ) : null}
            {progress !== null ? (
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
            {!fixedIncome && hourlyRate > 0 ? (
              <div className="rounded-xl border border-income/30 bg-income-soft/30 p-3 text-sm">
                <p className="text-muted">
                  {t("auto.k6ed1f39277")}{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(hourlyRate)}
                  </span>
                </p>
                <p className="mt-2 font-bold text-income">
                  {t("auto.k8a4f5aae8a")}{" "}
                  {expectedEarnings ? formatPrice(expectedEarnings) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("auto.k6d694699a1")}{formatDurationMinutes(data.monthWorkedMinutes)} {t("auto.k1f1551310b")}
                </p>
              </div>
            ) : null}
          </section>

          <section
            id="work-target-section"
            ref={setTargetSectionEl}
            className="glass space-y-3 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <Setting2 size={18} className="text-accent" />
              <h2 className="font-semibold">{t("auto.k1f55474ae3")}</h2>
            </div>
            <p className="text-xs text-muted">
              {t("auto.k14b554d2b1")}
              {workingDaysInMonth > 0 ? (
                <>
                  {" "} {t("auto.k30d7dd4f17")} {toPersianDigits(String(workingDaysInMonth))} {t("auto.k4212b64fed")}.
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <FormInput
                  label={t("auto.k4179f5e242")}
                  placeholder={fixedIncome ? t("pages.attendance.hoursPlaceholderFixed") : t("pages.attendance.hoursPlaceholderHourly")}
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                />
              </div>
              <Button onPress={() => void saveTarget()} isPending={savingTarget}>
                {t("common.save")}
              </Button>
            </div>
            {savedMonthTarget && workingDaysInMonth > 0 && targetHours ? (
              <p className="rounded-xl bg-accent/10 p-3 text-sm">
                {t("auto.k6dd5db0816")}{" "}
                <span className="font-bold">{formatDurationMinutes(savedMonthTarget)}</span>
                <span className="text-muted">
                  {" "}
                  ({targetHours} {t("auto.k4dbe762d48")} × {toPersianDigits(String(workingDaysInMonth))} {t("auto.k6702edb75e")}
                  {t("auto.k13a8d415d7")}
                </span>
              </p>
            ) : null}
          </section>

          <WorkMonthCalendar
            year={year}
            month={month}
            dailyMap={dailyMap}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          {data.sessions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              {t("auto.kc96acc3ffc")}
            </div>
          ) : (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">{t("auto.k5c57193ffe")}</h2>
              {data.sessions.map((session) => {
                const range = formatSessionRange(session);
                const linkedBudget =
                  session.budget && typeof session.budget !== "string"
                    ? session.budget
                    : null;

                return (
                  <article key={session._id} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {range.date} · {toPersianDigits(range.start)} {t("auto.k19330ade57")}{" "}
                          {toPersianDigits(range.end)}
                        </p>
                        <p className="mt-1 text-sm text-muted">{range.duration}</p>
                        {session.description ? (
                          <p className="mt-1 text-xs text-muted">{session.description}</p>
                        ) : null}
                        {linkedBudget ? (
                          <Link
                            href={PATHS.BUDGET(linkedBudget._id)}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-accent"
                          >
                            <Wallet size={14} />
                            {budgetLabel(linkedBudget)}
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {session.durationMinutes ? (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onPress={() => {
                              setEditSession(session);
                              setManualOpen(true);
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                        ) : null}
                        {!linkedBudget && session.durationMinutes ? (
                          <AttachBudgetButton
                            title={t("auto.k0fa31fbe97")}
                            description={t("auto.k3eb20c455b")}
                            context={{ type: "project", contextId: projectId }}
                            selectionMode="single"
                            onAttach={async (budgetId) => {
                              await workTimeApi.attachWorkSessionBudget(
                                projectId,
                                session._id,
                                budgetId,
                              );
                              await load();
                            }}
                          />
                        ) : null}
                        {session.durationMinutes ? (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onPress={() => void removeSession(session)}
                          >
                            <Trash size={16} />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {report ? (
            <WorkTimeAnalysisSection
              report={report}
              alerts={[]}
              scope="project"
              onAlertAction={(alert) => void handleAlertAction(alert)}
            />
          ) : null}
        </>
      )}

      <ManualWorkSessionModal
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setEditSession(null);
        }}
        projectId={projectId}
        defaultYear={year}
        defaultMonth={month}
        defaultDay={selectedDay ?? undefined}
        session={editSession}
        onSaved={() => void load()}
      />
    </div>
  );
}
