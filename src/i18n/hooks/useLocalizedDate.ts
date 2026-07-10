"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { Language } from "@/i18n";
import { toPersianDigits } from "@/common/utils/persian-digits";

const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const JALALI_MONTHS_EN = [
  "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
  "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
];

const JALALI_MONTHS_AR = [
  "فروردين", "أرديبهشت", "خرداد", "تير", "مرداد", "شهريور",
  "مهر", "آبان", "آذر", "دي", "بهمن", "أسفند",
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GREGORIAN_MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const GREGORIAN_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

function monthsFor(language: Language, calendar: "jalali" | "gregorian") {
  if (calendar === "jalali") {
    if (language === "ar") return JALALI_MONTHS_AR;
    if (language === "en") return JALALI_MONTHS_EN;
    return JALALI_MONTHS_FA;
  }
  if (language === "ar") return GREGORIAN_MONTHS_AR;
  if (language === "en") return GREGORIAN_MONTHS_EN;
  return GREGORIAN_MONTHS_FA;
}

export function useLocalizedDate() {
  const { language } = useTranslation();

  return useMemo(
    () => ({
      formatMonthYear(
        month: number,
        year: string | number,
        calendar: "jalali" | "gregorian" = "jalali",
      ) {
        const months = monthsFor(language, calendar);
        const name = months[month - 1] ?? "";
        const yearStr = language === "fa" ? toPersianDigits(String(year)) : String(year);
        return `${name} ${yearStr}`;
      },
      formatDayMonthYear(
        day: number,
        month: number,
        year: string | number,
        calendar: "jalali" | "gregorian" = "jalali",
      ) {
        const months = monthsFor(language, calendar);
        const name = months[month - 1] ?? "";
        const d = language === "fa" ? toPersianDigits(String(day)) : String(day);
        const y = language === "fa" ? toPersianDigits(String(year)) : String(year);
        return `${d} ${name} ${y}`;
      },
      formatCount(count: number | string) {
        const n = String(count);
        return language === "fa" ? toPersianDigits(n) : n;
      },
    }),
    [language],
  );
}
