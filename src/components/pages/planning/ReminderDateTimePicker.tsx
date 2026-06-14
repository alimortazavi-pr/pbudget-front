"use client";

import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

import "react-multi-date-picker/styles/colors/teal.css";

type ReminderDateTimePickerProps = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  onChange: (value: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  }) => void;
};

export function ReminderDateTimePicker({
  year,
  month,
  day,
  hour,
  minute,
  onChange,
}: ReminderDateTimePickerProps) {
  const value = new DateObject({
    year,
    month,
    day,
    hour,
    minute,
    calendar: persianCalendar,
  });

  function handleChange(selected: DateObject | DateObject[] | null) {
    if (!selected || Array.isArray(selected)) return;
    onChange({
      year: selected.year,
      month:
        typeof selected.month === "object"
          ? selected.month.number
          : Number(selected.month),
      day: selected.day,
      hour: selected.hour,
      minute: selected.minute,
    });
  }

  return (
    <div className="pb-filter-date">
      <DatePicker
        value={value}
        onChange={handleChange}
        format="YYYY/MM/DD HH:mm"
        locale={persianLocale}
        calendar={persianCalendar}
        plugins={[
          <TimePicker key="time" position="bottom" hideSeconds mStep={5} />,
        ]}
        portal
        zIndex={10050}
        calendarPosition="bottom-center"
        containerClassName="w-full"
        inputClass="w-full min-h-11 rounded-xl border border-border bg-field-background px-3 text-sm text-foreground outline-none"
        placeholder="تاریخ و ساعت"
      />
    </div>
  );
}
