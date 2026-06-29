import type { BusinessPermission } from "@/common/interfaces/business.interface";

const ATTENDANCE_PREFIX = "attendance.";

export function isAttendanceOnlyMode(
  permissions: BusinessPermission[] | undefined,
): boolean {
  if (!permissions?.length) return false;
  const hasSelf = permissions.includes("attendance.self_clock");
  if (!hasSelf) return false;
  const nonAttendance = permissions.filter(
    (p) => !p.startsWith(ATTENDANCE_PREFIX),
  );
  return nonAttendance.length === 0;
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  daily: "مرخصی روزانه",
  hourly: "مرخصی ساعتی",
  mission: "ماموریت",
  overtime: "اضافه‌کار",
  manual_attendance: "تردد دستی",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  approved: "تأیید شده",
  rejected: "رد شده",
};

export const WEEKDAY_LABELS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

export function minuteToTimeLabel(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeLabelToMinute(value: string) {
  const [h, m] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function minutesToHoursLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}
