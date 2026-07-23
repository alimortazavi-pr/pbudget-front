"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type FC,
  type PropsWithChildren,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import moment from "moment-jalali";

import type { PeriodDuration } from "@/common/constants/experience";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import {
  formatGregorianDate,
  formatGregorianMonthYear,
  formatGregorianYear,
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
  getNowDateParts,
} from "@/common/utils";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type PeriodContextValue = {
  duration: PeriodDuration;
  year: string;
  month: string;
  day: string;
  periodLabel: string;
  calendarType: "jalali" | "gregorian";
  updatePeriod: (patch: Partial<{
    duration: PeriodDuration;
    year: string;
    month: string;
    day: string;
  }>) => void;
  goToToday: () => void;
  shiftMonth: (delta: number) => void;
  shiftDay: (delta: number) => void;
  shiftYear: (delta: number) => void;
  setDate: (year: string, month: string, day: string) => void;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

function parseDuration(value: string | null): PeriodDuration {
  if (
    value === "daily" ||
    value === "monthly" ||
    value === "yearly" ||
    value === "all"
  ) {
    return value;
  }
  return "monthly";
}

export const PeriodProvider: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, get } = useHydratedSearchParams();
  const user = useAppSelector(userSelector);
  const calendarType = user?.preferences?.dateCalendar ?? "jalali";
  const nowParts = getNowDateParts(calendarType);

  const duration = parseDuration(hydrated ? get("duration", "monthly") : "monthly");
  const year = hydrated ? get("year", nowParts.year) : nowParts.year;
  const month = hydrated ? get("month", nowParts.month) : nowParts.month;
  const day = hydrated ? get("day", nowParts.day) : nowParts.day;

  const periodLabel = useMemo(() => {
    if (duration === "all") return t("auto.k9e425fc9f4");
    if (calendarType === "gregorian") {
      if (duration === "yearly") return formatGregorianYear(year);
      if (duration === "monthly") return formatGregorianMonthYear(year, month);
      return formatGregorianDate(year, month, day);
    }
    if (duration === "yearly") return formatJalaliYear(year);
    if (duration === "monthly") return formatJalaliMonthYear(year, month);
    return formatJalaliDate(year, month, day);
  }, [calendarType, duration, year, month, day, t]);

  const updatePeriod = useCallback(
    (patch: Partial<{
      duration: PeriodDuration;
      year: string;
      month: string;
      day: string;
    }>) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      Object.entries(patch).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (patch.duration === "all") {
        params.delete("day");
      }
      if (patch.duration === "yearly") {
        params.delete("day");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const goToToday = useCallback(() => {
    updatePeriod(getNowDateParts(calendarType));
  }, [calendarType, updatePeriod]);

  // When user switches jalali ↔ gregorian, URL year/month must be rewritten
  // (otherwise you get mixed labels like «مهر ۲۰۲۶» or empty month queries).
  const prevCalendarRef = useRef(calendarType);
  useEffect(() => {
    if (prevCalendarRef.current === calendarType) return;
    prevCalendarRef.current = calendarType;
    updatePeriod(getNowDateParts(calendarType));
  }, [calendarType, updatePeriod]);

  const shiftMonth = useCallback(
    (delta: number) => {
      if (calendarType === "gregorian") {
        const date = moment()
          .year(parseInt(year, 10))
          .month(parseInt(month, 10) - 1)
          .date(1)
          .add(delta, "month");
        updatePeriod({
          year: String(date.year()),
          month: String(date.month() + 1),
          day: String(date.date()),
        });
        return;
      }
      const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(
        delta,
        "jMonth",
      );
      updatePeriod({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
        day: String(date.jDate()),
      });
    },
    [calendarType, month, updatePeriod, year],
  );

  const shiftDay = useCallback(
    (delta: number) => {
      if (calendarType === "gregorian") {
        const date = moment()
          .year(parseInt(year, 10))
          .month(parseInt(month, 10) - 1)
          .date(parseInt(day, 10))
          .add(delta, "day");
        updatePeriod({
          year: String(date.year()),
          month: String(date.month() + 1),
          day: String(date.date()),
        });
        return;
      }
      const date = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD").add(
        delta,
        "day",
      );
      updatePeriod({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
        day: String(date.jDate()),
      });
    },
    [calendarType, day, month, updatePeriod, year],
  );

  const shiftYear = useCallback(
    (delta: number) => {
      updatePeriod({ year: String(parseInt(year, 10) + delta) });
    },
    [updatePeriod, year],
  );

  const setDate = useCallback(
    (nextYear: string, nextMonth: string, nextDay: string) => {
      updatePeriod({ year: nextYear, month: nextMonth, day: nextDay });
    },
    [updatePeriod],
  );

  const value = useMemo(
    () => ({
      duration,
      year,
      month,
      day,
      periodLabel,
      calendarType,
      updatePeriod,
      goToToday,
      shiftMonth,
      shiftDay,
      shiftYear,
      setDate,
    }),
    [
      duration,
      year,
      month,
      day,
      periodLabel,
      calendarType,
      updatePeriod,
      goToToday,
      shiftMonth,
      shiftDay,
      shiftYear,
      setDate,
    ],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) {
    throw new Error("usePeriod must be used within PeriodProvider");
  }
  return ctx;
}

/** Ensures period query params exist on first timeline visit */
export function usePeriodBootstrap() {
  const { duration, year, month, day, updatePeriod } = usePeriod();
  const { hydrated, get } = useHydratedSearchParams();

  useEffect(() => {
    if (!hydrated || get("duration")) return;
    updatePeriod({ duration, year, month, day });
  }, [day, duration, get, hydrated, month, updatePeriod, year]);
}
