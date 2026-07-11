"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type FC,
  type PropsWithChildren,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import moment from "moment-jalali";

import type { PeriodDuration } from "@/common/constants/experience";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import {
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
  getJalaliNow,
} from "@/common/utils";

type PeriodContextValue = {
  duration: PeriodDuration;
  year: string;
  month: string;
  day: string;
  periodLabel: string;
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
  const now = getJalaliNow();

  const duration = parseDuration(hydrated ? get("duration", "monthly") : "monthly");
  const year = hydrated ? get("year", String(now.jYear())) : String(now.jYear());
  const month = hydrated ? get("month", String(now.jMonth() + 1)) : String(now.jMonth() + 1);
  const day = hydrated ? get("day", String(now.jDate())) : String(now.jDate());

  const periodLabel = useMemo(() => {
    if (duration === "all") return t("auto.k9e425fc9f4");
    if (duration === "yearly") return formatJalaliYear(year);
    if (duration === "monthly") return formatJalaliMonthYear(year, month);
    return formatJalaliDate(year, month, day);
  }, [duration, year, month, day, t]);

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
    updatePeriod({
      year: String(now.jYear()),
      month: String(now.jMonth() + 1),
      day: String(now.jDate()),
    });
  }, [now, updatePeriod]);

  const shiftMonth = useCallback(
    (delta: number) => {
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
    [month, updatePeriod, year],
  );

  const shiftDay = useCallback(
    (delta: number) => {
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
    [day, month, updatePeriod, year],
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
