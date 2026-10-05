"use client";

import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Add, Clock, Login, Logout } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as workTimeApi from "@/common/api/work-time";
import type { IWorkTimeDashboard } from "@/common/interfaces/work-time.interface";
import { getJalaliNow } from "@/common/utils";
import {
  formatDailyRemainingMessage,
  useWorkSessionDailyReminder,
} from "@/common/hooks/useWorkSessionDailyReminder";
import { formatDurationMinutes } from "@/common/utils/work-time";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { QuickManualWorkSessionModal } from "@/components/pages/projects/QuickManualWorkSessionModal";

export function WorkTimeQuickWidget() {
  const { t } = useTranslation();
  // A fresh moment() on every render made `load` change every render, so
  // the effect refetched forever. Pin the period to primitive values.
  const [period] = useState(() => {
    const now = getJalaliNow();
    return { year: now.jYear(), month: now.jMonth() + 1, day: now.jDate() };
  });
  const { isFeatureEnabled, loading: subscriptionLoading } = useSubscriptionAccess();
  const workTimeEnabled = isFeatureEnabled("work_time");
  const [data, setData] = useState<IWorkTimeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const load = useCallback(async () => {
    if (!workTimeEnabled) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      const dashboard = await workTimeApi.fetchWorkTimeDashboard(
        period.year,
        period.month,
        { dashboardOnly: true },
      );
      setData(dashboard);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, workTimeEnabled]);

  useEffect(() => {
    if (subscriptionLoading) return;
    void load();
  }, [load, subscriptionLoading]);

  const dashboardProjects = useMemo(() => data?.projects ?? [], [data?.projects]);

  const activeProjectId = data?.activeSession?.project
    ? String(data.activeSession.project)
    : null;

  const activeRow = useMemo(
    () =>
      dashboardProjects.find((row) => row.project._id === activeProjectId) ?? null,
    [activeProjectId, dashboardProjects],
  );

  useWorkSessionDailyReminder({
    dailyStatus: activeRow ? data?.activeSessionDailyStatus : undefined,
    projectTitle: activeRow?.project.category?.title,
  });

  if (loading || !data || dashboardProjects.length === 0) return null;

  async function handleClockIn(projectId: string) {
    setActionProjectId(projectId);
    try {
      const result = await workTimeApi.clockIn(projectId);
      const msg = formatDailyRemainingMessage(result.dailyStatus);
      showToast(
        msg
          ? t("dashboard.clockInRecordedWithStatus", { status: msg })
          : t("dashboard.clockInRecorded"),
        "success",
      );
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
      showToast(t("projects.clockOutRecorded"), "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setActionProjectId(null);
    }
  }

  const todayStatus = data.globalTarget.dailyStatus;

  return (
    <>
      <section className="glass space-y-3 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            <h2 className="font-semibold">{t("dashboard.todayAttendance")}</h2>
          </div>
          <Link href={PATHS.WORK_ATTENDANCE} className="text-xs text-accent">
            {t("dashboard.allProjects")}
          </Link>
        </div>

        {todayStatus?.isWorkingDay === false ? (
          <p className="text-sm text-muted">{t("dashboard.notWorkingDayFull")}</p>
        ) : todayStatus ? (
          <p className="text-sm">
            {t("dashboard.todayLabel")}:{" "}
            <span className="font-semibold">
              {formatDurationMinutes(todayStatus.workedTodayMinutes)}
            </span>
            {todayStatus.requiredDailyMinutes ? (
              <>
                {" "}
                {t("dashboard.ofDuration")}{" "}
                {formatDurationMinutes(todayStatus.requiredDailyMinutes)}
              </>
            ) : null}
          </p>
        ) : null}

        {activeRow ? (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
            <p className="text-sm font-medium">
              {t("dashboard.currentlyWorking")}:{" "}
              {activeRow.project.category?.title ?? t("common.project")}
            </p>
            {data.activeSessionDailyStatus ? (
              <p className="mt-1 text-xs text-muted">
                {formatDailyRemainingMessage(data.activeSessionDailyStatus)}
              </p>
            ) : null}
            <Button
              size="sm"
              className="mt-2 bg-expense text-white"
              onPress={() => void handleClockOut(activeRow.project._id)}
              isPending={actionProjectId === activeRow.project._id}
            >
              <Logout size={14} />
              {t("common.clockOut")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dashboardProjects.slice(0, 3).map((row) => (
              <Button
                key={row.project._id}
                size="sm"
                className="bg-income text-white"
                onPress={() => void handleClockIn(row.project._id)}
                isPending={actionProjectId === row.project._id}
                isDisabled={Boolean(activeProjectId)}
              >
                <Login size={14} />
                {row.project.category?.title ?? t("common.clockIn")}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onPress={() => setManualOpen(true)}>
            <Add size={14} />
            {t("dashboard.manualEntry")}
          </Button>
        </div>
      </section>

      <QuickManualWorkSessionModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        projects={dashboardProjects.map((row) => row.project)}
        defaultYear={period.year}
        defaultMonth={period.month}
        defaultDay={period.day}
        onSaved={() => void load()}
      />
    </>
  );
}
