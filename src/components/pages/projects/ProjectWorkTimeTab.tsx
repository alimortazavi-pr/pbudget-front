"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Add, Edit2, ArrowLeft2, ArrowRight2, Login, Logout, Trash, Wallet } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as workTimeApi from "@/common/api/work-time";
import type { IProjectWorkSessions, IWorkSession } from "@/common/interfaces/work-time.interface";
import {
  formatDurationMinutes,
  formatJalaliMonthYear,
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
import { moment } from "@/common/utils/jalali-date";
import type { IBudget } from "@/common/interfaces/budget.interface";

type ProjectWorkTimeTabProps = {
  projectId: string;
  projectTitle: string;
  fixedIncome: boolean;
};

export function ProjectWorkTimeTab({
  projectId,
  projectTitle,
  fixedIncome,
}: ProjectWorkTimeTabProps) {
  const now = getJalaliNow();
  const [year, setYear] = useState(now.jYear());
  const [month, setMonth] = useState(now.jMonth() + 1);
  const [data, setData] = useState<IProjectWorkSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<IWorkSession | null>(null);
  const [targetHours, setTargetHours] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sessions = await workTimeApi.fetchProjectWorkSessions(projectId, year, month);
      setData(sessions);
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

  const progress = useMemo(() => {
    if (!data?.monthTargetMinutes || data.monthTargetMinutes <= 0) return null;
    return Math.min((data.monthWorkedMinutes / data.monthTargetMinutes) * 100, 100);
  }, [data]);

  function shiftMonth(offset: number) {
    const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(offset, "jMonth");
    setYear(date.jYear());
    setMonth(date.jMonth() + 1);
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
      showErrorToast(err);
    }
  }

  function budgetLabel(budget: IBudget | string | undefined) {
    if (!budget || typeof budget === "string") return null;
    return budget.description || "تراکنش مرتبط";
  }

  if (loading || !data) {
    return <div className="glass rounded-2xl p-8 text-center text-muted">در حال بارگذاری…</div>;
  }

  const isActive = Boolean(data.activeSession);

  return (
    <div className="space-y-4">
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
              خروج از {projectTitle}
            </Button>
          ) : (
            <Button
              className="bg-income text-white"
              onPress={() => void handleClockIn()}
              isPending={actionLoading}
            >
              <Login size={16} />
              ورود به {projectTitle}
            </Button>
          )}
          <Button variant="secondary" onPress={() => setManualOpen(true)}>
            <Add size={16} />
            ثبت دستی
          </Button>
          <Link href={PATHS.WORK_ATTENDANCE}>
            <Button variant="ghost" size="sm">
              همه پروژه‌ها
            </Button>
          </Link>
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
      </section>

      <section className="glass space-y-3 rounded-2xl p-4">
        <h3 className="font-semibold">ساعت موظف این پروژه (ماه جاری)</h3>
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

      {data.sessions.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted">
          هنوز ساعتی برای این ماه ثبت نشده
        </div>
      ) : (
        <div className="space-y-2">
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
        </div>
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
        session={editSession}
        onSaved={() => void load()}
      />
    </div>
  );
}
