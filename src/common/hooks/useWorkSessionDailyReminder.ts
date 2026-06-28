"use client";

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
        showToast(
          projectTitle
            ? `ساعت روزانه «${projectTitle}» گذشت — خروج را ثبت کنید`
            : "ساعت روزانه گذشت — خروج را ثبت کنید",
          "warning",
        );
        onRemind?.();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      firedRef.current = key;
      showToast(
        projectTitle
          ? `۳۰ دقیقه از پایان ساعت روزانه «${projectTitle}» گذشت — خروج را ثبت کنید`
          : "۳۰ دقیقه از پایان ساعت روزانه گذشت — خروج را ثبت کنید",
        "warning",
      );
      onRemind?.();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [dailyStatus?.remindAt, onRemind, projectTitle]);
}

export function formatDailyRemainingMessage(dailyStatus: IWorkDailyStatus) {
  if (!dailyStatus.requiredDailyMinutes) return null;
  if (!dailyStatus.isWorkingDay) return "امروز روز کاری نیست (جمعه یا تعطیل رسمی).";
  if (dailyStatus.remainingTodayMinutes === null) return null;
  if (dailyStatus.remainingTodayMinutes <= 0) {
    return "ساعت روزانه تکمیل شده — در صورت ادامه، خروج را فراموش نکنید.";
  }
  return `تا تکمیل ${formatDurationMinutes(dailyStatus.requiredDailyMinutes)} امروز، ${formatDurationMinutes(dailyStatus.remainingTodayMinutes)} مانده.`;
}
