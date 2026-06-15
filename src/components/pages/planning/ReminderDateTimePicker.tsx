"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker, { type DatePickerRef } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

import "react-multi-date-picker/styles/colors/teal.css";

export type ReminderDateTimeValue = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type ReminderDateTimePickerProps = ReminderDateTimeValue & {
  onDraftChange: (value: ReminderDateTimeValue) => void;
};

function toDateObject(value: ReminderDateTimeValue) {
  return new DateObject({
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour,
    minute: value.minute,
    calendar: persianCalendar,
  });
}

function fromDateObject(selected: DateObject): ReminderDateTimeValue {
  return {
    year: selected.year,
    month:
      typeof selected.month === "object"
        ? selected.month.number
        : Number(selected.month),
    day: selected.day,
    hour: selected.hour,
    minute: selected.minute,
  };
}

export function ReminderDateTimePicker({
  year,
  month,
  day,
  hour,
  minute,
  onDraftChange,
}: ReminderDateTimePickerProps) {
  const pickerRef = useRef<DatePickerRef>(null);
  const [draft, setDraft] = useState<ReminderDateTimeValue>({
    year,
    month,
    day,
    hour,
    minute,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!calendarOpen) {
      setDraft({ year, month, day, hour, minute });
    }
  }, [year, month, day, hour, minute, calendarOpen]);

  function updateDraft(next: ReminderDateTimeValue) {
    setDraft(next);
    onDraftChange(next);
  }

  function handlePickerChange(
    selected: DateObject | DateObject[] | null,
  ): false | void {
    if (!selected || Array.isArray(selected)) return;
    updateDraft(fromDateObject(selected));
    return false;
  }

  return (
    <div className="pb-filter-date space-y-3">
      <DatePicker
        ref={pickerRef}
        value={toDateObject(draft)}
        onChange={handlePickerChange}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => {
          setCalendarOpen(false);
          return false;
        }}
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
        inputClass="pb-form-date-input"
        placeholder="تاریخ و ساعت"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => pickerRef.current?.closeCalendar()}
        >
          بستن تقویم
        </Button>
      </div>
    </div>
  );
}
