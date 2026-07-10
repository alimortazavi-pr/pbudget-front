"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import { Calendar } from "react-multi-date-picker";

import { JALALI_MONTHS } from "@/common/utils";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { usePeriod } from "@/components/providers/PeriodProvider";

import "react-multi-date-picker/styles/colors/teal.css";

export function PeriodCalendarPanel() {
  const { t } = useTranslation();
  const { duration, year, month, day, setDate, updatePeriod, shiftYear } =
    usePeriod();

  if (duration === "all") {
    return (
      <div className="pb-timeline-calendar-all">
        <p className="text-sm font-medium">{t("نمای کلی")}</p>
        <p className="mt-1 text-xs text-muted">
          همه داده‌ها بدون محدودیت زمانی نمایش داده می‌شوند
        </p>
      </div>
    );
  }

  if (duration === "yearly") {
    return (
      <div className="pb-timeline-year-grid">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-secondary"
            onClick={() => shiftYear(-1)}
          >
            ‹
          </button>
          <p className="text-sm font-semibold">{toPersianDigits(year)}</p>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-secondary"
            onClick={() => shiftYear(1)}
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {JALALI_MONTHS.map((name, index) => {
            const monthNum = String(index + 1);
            const active = month === monthNum;
            return (
              <button
                key={name}
                type="button"
                className="pb-timeline-month-cell"
                data-active={active ? "true" : "false"}
                onClick={() =>
                  updatePeriod({
                    duration: "monthly",
                    month: monthNum,
                    day: "1",
                  })
                }
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const value = new DateObject({
    year: Number(year),
    month: Number(month),
    day: Number(day),
    calendar: persianCalendar,
  });

  return (
    <div className="pb-timeline-calendar">
      <Calendar
        value={value}
        calendar={persianCalendar}
        locale={persianLocale}
        onChange={(selected) => {
          if (!selected || Array.isArray(selected)) return;
          setDate(
            String(selected.year),
            String(selected.month),
            String(selected.day),
          );
          if (duration === "monthly") {
            updatePeriod({ duration: "daily" });
          }
        }}
        className="pb-inline-calendar"
      />
    </div>
  );
}
