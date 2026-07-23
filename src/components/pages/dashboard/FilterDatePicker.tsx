"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect } from "react";
import DateObject from "react-date-object";
import gregorianCalendar from "react-date-object/calendars/gregorian";
import persianCalendar from "react-date-object/calendars/persian";
import gregorianLocale from "react-date-object/locales/gregorian_en";
import persianLocale from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";

import type { UserDateCalendar } from "@/common/constants/user-preferences";
import { DATE_PICKER_Z_INDEX } from "@/common/constants/overlay-z-index";
import { useDatePickerOverlay } from "@/common/hooks/useDatePickerOverlay";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

import "react-multi-date-picker/styles/colors/teal.css";

type FilterDatePickerProps = {
  year: string;
  month: string;
  day: string;
  onChange: (value: { year: string; month: string; day: string }) => void;
  hideHint?: boolean;
  /** Better positioning + click handling inside modals */
  inModal?: boolean;
  calendarType?: UserDateCalendar;
};

export function FilterDatePicker({
  year,
  month,
  day,
  onChange,
  hideHint,
  inModal = false,
  calendarType,
}: FilterDatePickerProps) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const resolvedCalendar =
    calendarType ?? user?.preferences?.dateCalendar ?? "jalali";

  const {
    wrapperRef,
    calendarOpen,
    setCalendarOpen,
    usePortal,
    resolvedPortalTarget,
  } = useDatePickerOverlay(inModal);

  const isGregorian = resolvedCalendar === "gregorian";
  const calendar = isGregorian ? gregorianCalendar : persianCalendar;
  const locale = isGregorian ? gregorianLocale : persianLocale;
  const format = "YYYY/MM/DD";

  useEffect(() => {
    if (!inModal) return;

    const dialog = wrapperRef.current?.closest(".modal__dialog");
    if (!dialog) return;

    dialog.classList.toggle("pb-modal-date-open", calendarOpen);
    return () => {
      dialog.classList.remove("pb-modal-date-open");
    };
  }, [calendarOpen, inModal, wrapperRef]);

  const value =
    year && month
      ? new DateObject({
          year: Number(year),
          month: Number(month),
          day: Number(day || 1),
          calendar,
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
          {isGregorian
            ? t("dashboard.gregorianDateHint")
            : t("dashboard.monthlyDateHint")}
        </p>
      )}
      <DatePicker
        value={value}
        locale={locale}
        calendar={calendar}
        onChange={handleChange}
        onOpen={() => setCalendarOpen(true)}
        onClose={() => {
          setCalendarOpen(false);
          return undefined;
        }}
        format={format}
        editable={false}
        portal={usePortal}
        portalTarget={resolvedPortalTarget}
        fixMainPosition={inModal}
        zIndex={DATE_PICKER_Z_INDEX}
        calendarPosition={inModal ? "top-center" : "bottom-center"}
        offsetY={inModal ? 8 : undefined}
        containerClassName="w-full"
        inputClass="pb-form-date-input"
        placeholder={
          isGregorian
            ? t("dashboard.gregorianDatePlaceholder")
            : t("dashboard.datePlaceholder")
        }
      />
    </div>
  );
}
