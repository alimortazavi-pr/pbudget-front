"use client";

import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";

import "react-multi-date-picker/styles/colors/teal.css";

type FilterDatePickerProps = {
  year: string;
  month: string;
  day: string;
  onChange: (value: { year: string; month: string; day: string }) => void;
};

export function FilterDatePicker({
  year,
  month,
  day,
  onChange,
}: FilterDatePickerProps) {
  const value =
    year && month
      ? new DateObject({
          year: Number(year),
          month: Number(month),
          day: Number(day || 1),
          calendar: persianCalendar,
        })
      : undefined;

  function handleChange(selected: DateObject | DateObject[] | null) {
    if (!selected || Array.isArray(selected)) return;
    onChange({
      year: String(selected.year),
      month: String(selected.month),
      day: String(selected.day),
    });
  }

  return (
    <div className="pb-filter-date space-y-2">
      <p className="text-xs leading-5 text-muted">
        اگر تاریخ را در حالت ماهانه قرار داده باشید روز تاریخ محاسبه نمی‌شود
      </p>
      <DatePicker
        value={value}
        locale={persianLocale}
        calendar={persianCalendar}
        onChange={handleChange}
        format="YYYY/MM/DD"
        portal
        zIndex={10050}
        calendarPosition="bottom-center"
        containerClassName="w-full"
        inputClass="w-full min-h-11 rounded-xl border border-border bg-field-background px-3 text-sm text-foreground outline-none"
        placeholder="تاریخ"
      />
    </div>
  );
}
