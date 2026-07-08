import moment from "moment-jalali";

import {
  resolveBudgetDateCalendar,
  type UserDateCalendar,
} from "@/common/constants/user-preferences";
import {
  formatJalaliDate,
  formatJalaliDateSlashed,
  getJalaliNow,
  normalizeJalaliPart,
  padJalaliPart,
} from "./jalali-date";
import { toPersianDigits } from "./persian-digits";

const GREGORIAN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getNowDateParts(calendar: UserDateCalendar = "jalali") {
  if (calendar === "gregorian") {
    const now = moment();
    return {
      year: String(now.year()),
      month: String(now.month() + 1),
      day: String(now.date()),
    };
  }
  const now = getJalaliNow();
  return {
    year: now.format("jYYYY"),
    month: String(Number(now.format("jM"))),
    day: String(Number(now.format("jD"))),
  };
}

export function normalizeDatePart(
  value: string | number | null | undefined,
  fallback: string,
) {
  return normalizeJalaliPart(value, fallback);
}

export function formatGregorianDateSlashed(
  year: string,
  month: string,
  day: string,
) {
  return toPersianDigits(
    `${year}/${padJalaliPart(month)}/${padJalaliPart(day)}`,
  );
}

export function formatGregorianDate(
  year: string,
  month: string,
  day: string,
) {
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = GREGORIAN_MONTHS[monthIndex] ?? month;
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

export function formatBudgetDate(
  year: string,
  month: string,
  day: string,
  calendar?: UserDateCalendar | null,
) {
  const resolved = resolveBudgetDateCalendar(calendar);
  if (resolved === "gregorian") {
    return formatGregorianDate(year, month, day);
  }
  return formatJalaliDate(year, month, day);
}

export function formatBudgetDateSlashed(
  year: string,
  month: string,
  day: string,
  calendar?: UserDateCalendar | null,
) {
  const resolved = resolveBudgetDateCalendar(calendar);
  if (resolved === "gregorian") {
    return formatGregorianDateSlashed(year, month, day);
  }
  return formatJalaliDateSlashed(year, month, day);
}

export function formatBudgetDateTime(
  year: string,
  month: string,
  day: string,
  createdAt: string,
  calendar?: UserDateCalendar | null,
) {
  const time = toPersianDigits(moment(createdAt).format("HH:mm"));
  const date = formatBudgetDateSlashed(year, month, day, calendar);
  return `${time} - ${date}`;
}
