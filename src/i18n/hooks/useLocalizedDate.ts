"use client";

import { useMemo } from "react";
import { toPersianDigits } from "@/common/utils/persian-digits";

const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const GREGORIAN_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

const monthsFor = (calendar: "jalali" | "gregorian") =>
  calendar === "jalali" ? JALALI_MONTHS_FA : GREGORIAN_MONTHS_FA;

export function useLocalizedDate() {
  return useMemo(
    () => ({
      formatMonthYear(
        month: number,
        year: string | number,
        calendar: "jalali" | "gregorian" = "jalali",
      ) {
        const name = monthsFor(calendar)[month - 1] ?? "";
        return `${name} ${toPersianDigits(String(year))}`;
      },
      formatDayMonthYear(
        day: number,
        month: number,
        year: string | number,
        calendar: "jalali" | "gregorian" = "jalali",
      ) {
        const name = monthsFor(calendar)[month - 1] ?? "";
        return `${toPersianDigits(String(day))} ${name} ${toPersianDigits(String(year))}`;
      },
      formatCount(count: number | string) {
        return toPersianDigits(String(count));
      },
    }),
    [],
  );
}
