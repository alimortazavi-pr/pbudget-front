"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import moment from "moment-jalali";

import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { getNowDateParts } from "@/common/utils";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function usePeriodQuery(basePath: string) {
  const router = useRouter();
  const { hydrated, get, getAll } = useHydratedSearchParams();
  const user = useAppSelector(userSelector);
  const calendarType = user?.preferences?.dateCalendar ?? "jalali";
  const defaults = getNowDateParts(calendarType);

  const year = hydrated ? get("year", defaults.year) : defaults.year;
  const month = hydrated ? get("month", defaults.month) : defaults.month;
  const day = hydrated ? get("day", defaults.day) : defaults.day;

  const updateQuery = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : getAll().toString(),
      );
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      const qs = params.toString();
      const nextUrl = qs ? `${basePath}?${qs}` : basePath;
      router.replace(nextUrl, { scroll: false });
    },
    [basePath, getAll, router],
  );

  const goToToday = useCallback(() => {
    updateQuery(getNowDateParts(calendarType));
  }, [calendarType, updateQuery]);

  const prevCalendarRef = useRef(calendarType);
  useEffect(() => {
    if (prevCalendarRef.current === calendarType) return;
    prevCalendarRef.current = calendarType;
    updateQuery(getNowDateParts(calendarType));
  }, [calendarType, updateQuery]);

  const shiftMonth = useCallback(
    (delta: number) => {
      if (calendarType === "gregorian") {
        const date = moment()
          .year(parseInt(year, 10))
          .month(parseInt(month, 10) - 1)
          .date(1)
          .add(delta, "month");
        updateQuery({
          year: String(date.year()),
          month: String(date.month() + 1),
        });
        return;
      }
      const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(delta, "jMonth");
      updateQuery({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
      });
    },
    [calendarType, month, updateQuery, year],
  );

  const shiftDay = useCallback(
    (delta: number) => {
      if (calendarType === "gregorian") {
        const date = moment()
          .year(parseInt(year, 10))
          .month(parseInt(month, 10) - 1)
          .date(parseInt(day, 10))
          .add(delta, "day");
        updateQuery({
          year: String(date.year()),
          month: String(date.month() + 1),
          day: String(date.date()),
        });
        return;
      }
      const date = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD").add(delta, "day");
      updateQuery({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
        day: String(date.jDate()),
      });
    },
    [calendarType, day, month, updateQuery, year],
  );

  const shiftYear = useCallback(
    (delta: number) => {
      updateQuery({ year: String(parseInt(year, 10) + delta) });
    },
    [updateQuery, year],
  );

  return {
    hydrated,
    year,
    month,
    day,
    calendarType,
    updateQuery,
    goToToday,
    shiftMonth,
    shiftDay,
    shiftYear,
  };
}
