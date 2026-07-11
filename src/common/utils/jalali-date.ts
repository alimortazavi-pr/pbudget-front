import { getTranslator } from "@/i18n";
const t = getTranslator();
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

/** Display month and year: e.g. Khordad 1405 */
export function formatJalaliMonthYear(year: string, month: string) {
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = JALALI_MONTHS[monthIndex] ?? month;
  return `${monthName} ${toPersianDigits(year)}`;
}

/** Display year label */
export function formatJalaliYear(year: string) {
  return getTranslator()("common.jalaliYear", { year: toPersianDigits(year) });
}
/** Short display: e.g. 18 Khordad 1405 */
export function formatJalaliDate(year: string, month: string, day: string) {
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = JALALI_MONTHS[monthIndex] ?? month;
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

/** Slash format: 1405/03/18 */
export function formatJalaliDateSlashed(
  year: string,
  month: string,
  day: string,
) {
  return toPersianDigits(
    `${year}/${padJalaliPart(month)}/${padJalaliPart(day)}`,
  );
}

/** Saturday=0 … Friday=6 (matches JALALI_WEEKDAYS_SHORT) */
export function getJalaliWeekdayIndex(year: number, month: number, day: number) {
  const m = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD");
  return (m.day() + 1) % 7;
}

export function getJalaliFirstWeekdayIndex(year: number, month: number) {
  return getJalaliWeekdayIndex(year, month, 1);
}

/** Format ISO datetime to Jalali */
export function formatIsoDateTimeJalali(iso: string) {
  return toPersianDigits(moment(iso).format("jYYYY/jMM/jDD HH:mm"));
}

/** Record time + transaction date: 10:40 - 1405/03/18 */
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
  t("auto.kf214419676"),
  t("auto.kdb22839210"),
  t("auto.k1b739f54d3"),
  t("auto.kc913f56088"),
  t("auto.kcaaedae224"),
  t("auto.kb7ab4dbb75"),
  t("auto.k70e3ef0e41"),
  t("auto.k6cc414841b"),
  t("auto.k818ae17ddb"),
  t("auto.k1f82cde611"),
  t("auto.k10ac1e5f38"),
  t("auto.kf1f5da017a"),
];

/** Saturday = 0 … Friday = 6 */
export const JALALI_WEEKDAYS_SHORT = [t("auto.kd42b280f42"), t("auto.ka5714dc80b"), t("auto.k5cff1093c4"), t("auto.k499cc95fd8"), t("auto.k80e867783f"), t("auto.k3f7feaa8d0"), t("auto.ke2f45e1615")] as const;

/** Jalali leap year (33-year cycle) */
export function isJalaliLeapYear(year: number): boolean {
  const rem = ((year % 33) + 33) % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
}

/** Days in Jalali month — SSR-safe without jDaysInMonth */
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
  const t = getTranslator();
  return t("common.hourRange", {
    start: formatHourLabel(startHour),
    end: formatHourLabel(endHour),
  });
}

/** Short display with time: 18 Khordad 1405 · 14:07 */
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
