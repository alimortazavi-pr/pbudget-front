import { getTranslator } from "@/i18n";
import { toPersianDigits } from "./persian-digits";

export function minuteToTimeString(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToMinute(value: string) {
  const t = getTranslator();
  const normalized = value.replace(/[۰-۹]/g, (d) =>
    String(t("auto.kab58d58167").indexOf(d)),
  );
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatDurationMinutes(totalMinutes: number) {
  const t = getTranslator();
  if (totalMinutes <= 0) return toPersianDigits(t("auto.k71aaaddc12"));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return t("common.durationMinutes", {
      count: toPersianDigits(String(minutes)),
    });
  }
  if (minutes === 0) {
    return t("common.durationHours", {
      count: toPersianDigits(String(hours)),
    });
  }
  return t("common.durationHoursAndMinutes", {
    hours: toPersianDigits(String(hours)),
    minutes: toPersianDigits(String(minutes)),
  });
}

export function formatDurationShort(totalMinutes: number) {
  const t = getTranslator();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${toPersianDigits(String(minutes))}${t("common.durationMinuteAbbr")}`;
  }
  if (minutes === 0) {
    return `${toPersianDigits(String(hours))}${t("common.durationHourAbbr")}`;
  }
  return `${toPersianDigits(String(hours))}${t("common.durationHourAbbr")} ${toPersianDigits(String(minutes))}${t("common.durationMinuteAbbr")}`;
}

export function hoursInputToMinutes(hours: string) {
  const t = getTranslator();
  const normalized = hours.replace(/[۰-۹]/g, (d) =>
    String(t("auto.kab58d58167").indexOf(d)),
  );
  const value = parseFloat(normalized.replace(",", "."));
  if (Number.isNaN(value) || value <= 0) return null;
  return Math.round(value * 60);
}

export function minutesToHoursInput(totalMinutes: number) {
  const hours = totalMinutes / 60;
  return String(hours);
}
