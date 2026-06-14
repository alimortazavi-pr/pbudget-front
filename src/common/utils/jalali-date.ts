import moment from "moment-jalali";

import { toPersianDigits } from "./persian-digits";

export function getJalaliNow() {
  return moment().locale("fa");
}

export function padJalaliPart(value: string | number): string {
  const n = String(value);
  return n.length === 1 ? `0${n}` : n;
}

/** نمایش ماه و سال: خرداد ۱۴۰۵ */
export function formatJalaliMonthYear(year: string, month: string) {
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = JALALI_MONTHS[monthIndex] ?? month;
  return `${monthName} ${toPersianDigits(year)}`;
}

/** نمایش سال: سال ۱۴۰۵ */
export function formatJalaliYear(year: string) {
  return `سال ${toPersianDigits(year)}`;
}
/** نمایش کوتاه: ۱۸ خرداد ۱۴۰۵ */
export function formatJalaliDate(year: string, month: string, day: string) {
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = JALALI_MONTHS[monthIndex] ?? month;
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

/** نمایش اسلش‌دار: ۱۴۰۵/۰۳/۱۸ */
export function formatJalaliDateSlashed(
  year: string,
  month: string,
  day: string,
) {
  return toPersianDigits(
    `${year}/${padJalaliPart(month)}/${padJalaliPart(day)}`,
  );
}

/** زمان ثبت + تاریخ تراکنش: ۱۰:۴۰ - ۱۴۰۵/۰۳/۱۸ */
export function formatBudgetDateTime(
  year: string,
  month: string,
  day: string,
  createdAt: string,
) {
  const time = toPersianDigits(moment(createdAt).format("HH:mm"));
  const date = formatJalaliDateSlashed(year, month, day);
  return `${time} - ${date}`;
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** شنبه = 0 … جمعه = 6 */
export const JALALI_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export function formatHourLabel(hour: number) {
  return toPersianDigits(`${String(hour).padStart(2, "0")}:00`);
}

export function formatHourRange(startHour?: number, endHour?: number) {
  if (startHour === undefined || endHour === undefined) return null;
  return `${formatHourLabel(startHour)} تا ${formatHourLabel(endHour)}`;
}

export { moment };
