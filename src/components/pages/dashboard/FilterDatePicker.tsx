"use client";

import { useEffect, useRef, useState } from "react";
import DateObject from "react-date-object";
import persianCalendar from "react-date-object/calendars/persian";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";

import { DATE_PICKER_Z_INDEX } from "@/common/constants/overlay-z-index";

import "react-multi-date-picker/styles/colors/teal.css";

type FilterDatePickerProps = {
  year: string;
  month: string;
  day: string;
  onChange: (value: { year: string; month: string; day: string }) => void;
  hideHint?: boolean;
  /** Better positioning + click handling inside modals */
  inModal?: boolean;
};

export function FilterDatePicker({
  year,
  month,
  day,
  onChange,
  hideHint,
  inModal = false,
}: FilterDatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!inModal) return;

    const dialog = wrapperRef.current?.closest(".modal__dialog");
    if (!dialog) return;

    dialog.classList.toggle("pb-modal-date-open", calendarOpen);
    return () => {
      dialog.classList.remove("pb-modal-date-open");
    };
  }, [calendarOpen, inModal]);

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
    <div ref={wrapperRef} className="pb-filter-date relative z-[1] space-y-2">
      {!hideHint && (
        <p className="text-xs leading-5 text-muted">
          اگر تاریخ را در حالت ماهانه قرار داده باشید روز تاریخ محاسبه نمی‌شود
        </p>
      )}
      <DatePicker
        value={value}
        locale={persianLocale}
        calendar={persianCalendar}
        onChange={handleChange}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => {
          setCalendarOpen(false);
          return undefined;
        }}
        format="YYYY/MM/DD"
        editable={false}
        portal={inModal ? Boolean(portalTarget) : true}
        portalTarget={inModal && portalTarget ? portalTarget : undefined}
        fixMainPosition={inModal}
        zIndex={DATE_PICKER_Z_INDEX}
        calendarPosition={inModal ? "top-center" : "bottom-center"}
        offsetY={inModal ? 8 : undefined}
        containerClassName="w-full"
        inputClass="pb-form-date-input"
        placeholder="تاریخ"
      />
    </div>
  );
}
