import { toPersianDigits } from "./persian-digits";

export function minuteToTimeString(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToMinute(value: string) {
  const normalized = value.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
  );
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatDurationMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return toPersianDigits("۰ دقیقه");
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${toPersianDigits(String(minutes))} دقیقه`;
  if (minutes === 0) return `${toPersianDigits(String(hours))} ساعت`;
  return `${toPersianDigits(String(hours))} ساعت و ${toPersianDigits(String(minutes))} دقیقه`;
}

export function formatDurationShort(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${toPersianDigits(String(minutes))}د`;
  if (minutes === 0) return `${toPersianDigits(String(hours))}س`;
  return `${toPersianDigits(String(hours))}س ${toPersianDigits(String(minutes))}د`;
}

export function hoursInputToMinutes(hours: string) {
  const normalized = hours.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
  );
  const value = parseFloat(normalized.replace(",", "."));
  if (Number.isNaN(value) || value <= 0) return null;
  return Math.round(value * 60);
}

export function minutesToHoursInput(totalMinutes: number) {
  const hours = totalMinutes / 60;
  return String(hours);
}
