"use client";

import { getTranslator } from "@/i18n";
import { useEffect, useRef } from "react";

import type { IWorkDailyStatus } from "@/common/interfaces/work-time.interface";
import { formatDurationMinutes } from "@/common/utils/work-time";
import { showToast } from "@/common/utils/toast";

type UseWorkSessionDailyReminderOptions = {
  dailyStatus: IWorkDailyStatus | null | undefined;
  projectTitle?: string;
  onRemind?: () => void;
};

export function useWorkSessionDailyReminder({
  dailyStatus,
  projectTitle,
  onRemind,
}: UseWorkSessionDailyReminderOptions) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dailyStatus?.remindAt) return;

    const remindAtMs = new Date(dailyStatus.remindAt).getTime();
    const key = dailyStatus.remindAt;
    if (firedRef.current === key) return;

    const delay = remindAtMs - Date.now();
    if (delay <= 0) {
      if (firedRef.current !== key) {
        firedRef.current = key;
        const t = getTranslator();
        showToast(
          projectTitle
            ? t("projects.dailyHoursPassed", { project: projectTitle })
            : t("auto.k5a194a165d"),
          "warning",
        );
        onRemind?.();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      firedRef.current = key;
      const t = getTranslator();
      showToast(
        projectTitle
          ? t("projects.dailyHoursPassedReminder", { project: projectTitle })
          : t("auto.kac0fe999ff"),
        "warning",
      );
      onRemind?.();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [dailyStatus?.remindAt, onRemind, projectTitle]);
}

export function formatDailyRemainingMessage(dailyStatus: IWorkDailyStatus) {
  const t = getTranslator();
  if (!dailyStatus.requiredDailyMinutes) return null;
  if (!dailyStatus.isWorkingDay) return t("auto.k25477be49d");
  if (dailyStatus.remainingTodayMinutes === null) return null;
  if (dailyStatus.remainingTodayMinutes <= 0) {
    return t("auto.k78044a1b04");
  }
  return t("common.dailyRemainingProgress", {
    required: formatDurationMinutes(dailyStatus.requiredDailyMinutes),
    remaining: formatDurationMinutes(dailyStatus.remainingTodayMinutes),
  });
}
