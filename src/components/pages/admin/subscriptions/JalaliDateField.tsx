"use client";

import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";
import { Button } from "@heroui/react";
import { CloseCircle } from "iconsax-reactjs";

import { DATE_PICKER_Z_INDEX } from "@/common/constants/overlay-z-index";
import { useDatePickerOverlay } from "@/common/hooks/useDatePickerOverlay";
import { DatePickerInput } from "@/components/common/form/DatePickerInput";

import "react-multi-date-picker/styles/colors/teal.css";

/**
 * Jalali date picker bound to an ISO string. `edge` decides whether the picked
 * day maps to its first or last moment (start / end of a validity window).
 */
export function JalaliDateField({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  edge = "start",
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  edge?: "start" | "end";
}) {
  const { wrapperRef, setCalendarOpen, usePortal, resolvedPortalTarget, inModal } = useDatePickerOverlay(true);
  const current = value ? new DateObject({ date: new Date(value), calendar: persianCalendar, locale: persianLocale }) : undefined;

  return (
    <div ref={wrapperRef} className="relative z-[1] flex items-center gap-1">
      <DatePicker
        value={current}
        calendar={persianCalendar}
        locale={persianLocale}
        onChange={(selected: DateObject | DateObject[] | null) => {
          if (!selected || Array.isArray(selected)) return;
          const date = selected.toDate();
          if (edge === "end") date.setHours(23, 59, 59, 0);
          else date.setHours(0, 0, 0, 0);
          onChange(date.toISOString());
        }}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => {
          setCalendarOpen(false);
          return undefined;
        }}
        format="YYYY/MM/DD"
        editable={false}
        portal={usePortal}
        portalTarget={resolvedPortalTarget}
        fixMainPosition={inModal}
        zIndex={DATE_PICKER_Z_INDEX}
        calendarPosition="top-center"
        containerClassName="w-full"
        render={<DatePickerInput placeholder={placeholder} className="w-full" />}
      />
      {value ? (
        <Button isIconOnly size="sm" variant="ghost" aria-label="پاک کردن تاریخ" onPress={() => onChange(null)}>
          <CloseCircle size={16} />
        </Button>
      ) : null}
    </div>
  );
}
