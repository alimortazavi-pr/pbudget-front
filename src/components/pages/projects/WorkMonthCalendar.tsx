"use client";

import {
  formatDurationMinutes,
  formatDurationShort,
  getJalaliDaysInMonth,
  getJalaliFirstWeekdayIndex,
  getJalaliNow,
  JALALI_WEEKDAYS_SHORT,
  toPersianDigits,
} from "@/common/utils";

type WorkMonthCalendarProps = {
  year: number;
  month: number;
  dailyMap: Map<number, number>;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  hint?: string;
};

export function WorkMonthCalendar({
  year,
  month,
  dailyMap,
  selectedDay,
  onSelectDay,
  hint = "روی هر روز بزنید تا جزئیات را ببینید",
}: WorkMonthCalendarProps) {
  const now = getJalaliNow();
  const daysInMonth = getJalaliDaysInMonth(year, month);
  const leadingBlanks = getJalaliFirstWeekdayIndex(year, month);

  return (
    <section className="glass space-y-3 rounded-2xl p-4">
      <h2 className="font-semibold">تقویم کارکرد ماه</h2>
      <p className="text-xs text-muted">{hint}</p>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
        {JALALI_WEEKDAYS_SHORT.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <div key={`blank-${index}`} aria-hidden className="p-2" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const minutes = dailyMap.get(day) ?? 0;
          const isSelected = selectedDay === day;
          const isToday =
            day === now.jDate() &&
            month === now.jMonth() + 1 &&
            year === now.jYear();

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`cursor-pointer rounded-xl p-2 text-center transition ${
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : minutes > 0
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-surface-secondary text-muted"
              } ${isToday ? "ring-2 ring-accent/50" : ""}`}
            >
              <p className="text-sm font-semibold">{toPersianDigits(String(day))}</p>
              {minutes > 0 ? (
                <p className="mt-0.5 text-[10px]">{formatDurationShort(minutes)}</p>
              ) : null}
            </button>
          );
        })}
      </div>
      {selectedDay ? (
        <p className="rounded-xl bg-surface-secondary p-3 text-sm">
          روز {toPersianDigits(String(selectedDay))}:{" "}
          <span className="font-semibold">
            {formatDurationMinutes(dailyMap.get(selectedDay) ?? 0)}
          </span>
        </p>
      ) : null}
    </section>
  );
}
