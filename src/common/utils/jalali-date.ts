import moment from "moment-jalali";

import { toPersianDigits } from "./persian-digits";

export function getJalaliNow() {
  return moment().locale("fa");
}

export function padJalaliPart(value: string | number): string {
  const n = String(value);
  return n.length === 1 ? `0${n}` : n;
}

/** API may return numbers; DTO expects strings. */
export function normalizeJalaliPart(
  value: string | number | null | undefined,
  fallback: string,
): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
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

/** شنبه=۰ … جمعه=۶ (مطابق JALALI_WEEKDAYS_SHORT) */
export function getJalaliWeekdayIndex(year: number, month: number, day: number) {
  const m = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD");
  return (m.day() + 1) % 7;
}

export function getJalaliFirstWeekdayIndex(year: number, month: number) {
  return getJalaliWeekdayIndex(year, month, 1);
}

/** نمایش تاریخ-زمان ISO به جلالی */
export function formatIsoDateTimeJalali(iso: string) {
  return toPersianDigits(moment(iso).format("jYYYY/jMM/jDD HH:mm"));
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

/** سال کبیسه جلالی (چرخه ۳۳ ساله) */
export function isJalaliLeapYear(year: number): boolean {
  const rem = ((year % 33) + 33) % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
}

/** تعداد روز ماه جلالی — بدون وابستگی به jDaysInMonth (سازگار با SSR) */
export function getJalaliDaysInMonth(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) return isJalaliLeapYear(year) ? 30 : 29;
  return 30;
}

export function formatHourLabel(hour: number) {
  return toPersianDigits(`${String(hour).padStart(2, "0")}:00`);
}

export function formatHourRange(startHour?: number, endHour?: number) {
  if (startHour === undefined || endHour === undefined) return null;
  return `${formatHourLabel(startHour)} تا ${formatHourLabel(endHour)}`;
}

/** نمایش کوتاه با ساعت: ۱۸ خرداد ۱۴۰۵ · ۱۴:۰۷ */
export function formatJalaliDateWithTime(
  year: string | number,
  month: string | number,
  day: string | number,
  hour?: number | null,
  minute?: number | null,
) {
  const date = formatJalaliDate(String(year), String(month), String(day));
  if (hour == null || minute == null) return date;
  const time = toPersianDigits(
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  );
  return `${date} · ${time}`;
}

export function formatJalaliDateTime(
  year: number | string,
  month: number | string,
  day: number | string,
  hour: number | string,
  minute: number | string,
) {
  const date = formatJalaliDateSlashed(String(year), String(month), String(day));
  const time = toPersianDigits(
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  );
  return `${date} · ${time}`;
}

type BudgetDateParts = {
  year: string | number;
  month: string | number;
  day: string | number;
  createdAt?: string;
};

function budgetDateTimestamp({ year, month, day }: BudgetDateParts) {
  return (
    Number(year) * 10_000 +
    Number(month) * 100 +
    Number(day)
  );
}

/** Sort by user-set transaction date (newest first), then creation time. */
export function compareBudgetsByTransactionDateDesc(
  a: BudgetDateParts,
  b: BudgetDateParts,
) {
  const dateDiff = budgetDateTimestamp(b) - budgetDateTimestamp(a);
  if (dateDiff !== 0) return dateDiff;
  return (
    new Date(b.createdAt ?? 0).getTime() -
    new Date(a.createdAt ?? 0).getTime()
  );
}

export function sortBudgetsByTransactionDateDesc<T extends BudgetDateParts>(
  budgets: T[],
): T[] {
  return [...budgets].sort(compareBudgetsByTransactionDateDesc);
}

export { moment };
