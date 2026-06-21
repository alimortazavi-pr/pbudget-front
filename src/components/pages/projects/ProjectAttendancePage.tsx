"use client";

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
import {
  formatDurationMinutes,
  formatDurationShort,
  formatJalaliMonthYear,
  formatPrice,
  getJalaliDaysInMonth,
  getJalaliNow,
  hoursInputToMinutes,
  minutesToHoursInput,
  toEnglishDigits,
  toPersianDigits,
} from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
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
  const now = getJalaliNow();
  const [year, setYear] = useState(now.jYear());
  const [month, setMonth] = useState(now.jMonth() + 1);
  const [projectTitle, setProjectTitle] = useState("پروژه");
  const [fixedIncome, setFixedIncome] = useState(false);
  const [trackWorkTime, setTrackWorkTime] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [data, setData] = useState<IProjectWorkSessions | null>(null);
  const [report, setReport] = useState<IWorkTimeReport | null>(null);
  const [alerts, setAlerts] = useState<IWorkTimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<IWorkSession | null>(null);
  const [targetHours, setTargetHours] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [targetSectionEl, setTargetSectionEl] = useState<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const projectDetail = await projectsApi.fetchProject(projectId);
      setProjectTitle(projectDetail.project.category?.title ?? "پروژه");
      setFixedIncome(projectDetail.project.fixedIncome ?? false);
      setTrackWorkTime(projectDetail.project.trackWorkTime !== false);
      setHourlyRate(projectDetail.project.hourlyRate ?? 0);

      if (projectDetail.project.trackWorkTime === false) {
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
        sessions.monthTargetMinutes
          ? minutesToHoursInput(sessions.monthTargetMinutes)
          : "",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [projectId, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const daysInMonth = useMemo(() => getJalaliDaysInMonth(year, month), [year, month]);

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
      await workTimeApi.clockIn(projectId);
      showToast("ورود ثبت شد", "success");
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
      showToast("خروج ثبت شد", "success");
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
      showToast("ساعت موظف را وارد کنید");
      return;
    }
    setSavingTarget(true);
    try {
      await workTimeApi.upsertMonthlyTarget({
        year,
        month,
        requiredMinutes: minutes,
        projectId,
      });
      showToast("ساعت موظف پروژه ذخیره شد", "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSavingTarget(false);
    }
  }

  async function removeSession(session: IWorkSession) {
    if (!confirm("این ردیف حذف شود؟")) return;
    try {
      await workTimeApi.deleteWorkSession(projectId, session._id);
      showToast("حذف شد", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function handleAlertAction(alert: IWorkTimeAlert) {
    if (alert.action === "clock-out") {
      setActionLoading(true);
      try {
        await workTimeApi.clockOut(projectId);
        showToast("خروج ثبت شد", "success");
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
    return budget.description || "تراکنش مرتبط";
  }

  const expectedEarnings = useMemo(() => {
    if (!hourlyRate || !data?.monthWorkedMinutes) return null;
    return Math.round((data.monthWorkedMinutes / 60) * hourlyRate);
  }, [hourlyRate, data?.monthWorkedMinutes]);

  const isActive = Boolean(data?.activeSession);

  if (!loading && !trackWorkTime) {
    return (
      <div className="space-y-5 pb-6">
        <section className="rounded-3xl bg-gradient-to-br from-slate-600 to-slate-700 p-5 text-white shadow-lg">
          <h1 className="text-2xl font-bold">{projectTitle}</h1>
          <p className="mt-2 text-sm leading-7 text-white/80">
            این پروژه نیاز به ثبت ساعت کاری ندارد.
          </p>
          <Link
            href={PATHS.PROJECT(projectId)}
            className="mt-3 inline-flex text-sm font-medium text-white/90 underline-offset-2 hover:underline"
          >
            بازگشت به پروژه
          </Link>
        </section>
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          از تنظیمات پروژه می‌توانید «ثبت ساعت کاری» را فعال کنید.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">حضور و غیاب پروژه</p>
        <h1 className="mt-1 text-2xl font-bold">{projectTitle}</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          ورود و خروج، ثبت دستی ساعات و تحلیل کارکرد این پروژه
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link
            href={PATHS.PROJECT(projectId)}
            className="font-medium text-white/90 underline-offset-2 hover:underline"
          >
            بازگشت به پروژه
          </Link>
          <Link
            href={PATHS.WORK_ATTENDANCE}
            className="font-medium text-white/90 underline-offset-2 hover:underline"
          >
            تحلیل کلی همه پروژه‌ها
          </Link>
        </div>
      </section>

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

          <section className="glass space-y-3 rounded-2xl p-4">
            <p className="text-sm text-muted">
              {fixedIncome
                ? "پروژه با درآمد ثابت — ساعت موظف معمولاً ثابت ماهانه است."
                : "پروژه ساعتی/قراردادی — ساعت کار را برای فاکتور و تحلیل ثبت کنید."}
            </p>
            <div className="flex flex-wrap gap-2">
              {isActive ? (
                <Button
                  className="bg-expense text-white"
                  onPress={() => void handleClockOut()}
                  isPending={actionLoading}
                >
                  <Logout size={16} />
                  خروج
                </Button>
              ) : (
                <Button
                  className="bg-income text-white"
                  onPress={() => void handleClockIn()}
                  isPending={actionLoading}
                >
                  <Login size={16} />
                  ورود
                </Button>
              )}
              <Button variant="secondary" onPress={() => setManualOpen(true)}>
                <Add size={16} />
                ثبت دستی
              </Button>
            </div>
            <div className="rounded-xl bg-surface-secondary p-3 text-sm">
              کارکرد این ماه:{" "}
              <span className="font-bold">{formatDurationMinutes(data.monthWorkedMinutes)}</span>
              {data.monthTargetMinutes
                ? ` · هدف ${formatDurationMinutes(data.monthTargetMinutes)}`
                : ""}
            </div>
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
                  نرخ ساعتی:{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(hourlyRate)}
                  </span>
                </p>
                <p className="mt-2 font-bold text-income">
                  مبلغ قابل دریافت این ماه:{" "}
                  {expectedEarnings ? formatPrice(expectedEarnings) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  بر اساس {formatDurationMinutes(data.monthWorkedMinutes)} کارکرد ثبت‌شده
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
              <h2 className="font-semibold">ساعت موظف این پروژه (ماه جاری)</h2>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <FormInput
                  label="ساعت موظف"
                  placeholder={fixedIncome ? "مثلاً ۱۷۶" : "مثلاً ۸۰"}
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                />
              </div>
              <Button onPress={() => void saveTarget()} isPending={savingTarget}>
                ذخیره
              </Button>
            </div>
          </section>

          <section className="glass space-y-3 rounded-2xl p-4">
            <h2 className="font-semibold">تقویم کارکرد ماه</h2>
            <p className="text-xs text-muted">روی هر روز بزنید تا جزئیات را ببینید</p>
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

          {data.sessions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              هنوز ساعتی برای این ماه ثبت نشده
            </div>
          ) : (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">جلسات کاری</h2>
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
                          {range.date} · {toPersianDigits(range.start)} تا{" "}
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
                            title="لینک تراکنش"
                            description="درآمد یا پرداخت مرتبط با این ساعت را وصل کنید."
                            context={{ type: "project", contextId: projectId }}
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
