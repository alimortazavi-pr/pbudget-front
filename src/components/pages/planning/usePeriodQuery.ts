"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import moment from "moment-jalali";

import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { getJalaliNow } from "@/common/utils";

function defaultPeriod(now = getJalaliNow()) {
  return {
    year: String(now.jYear()),
    month: String(now.jMonth() + 1),
    day: String(now.jDate()),
  };
}

export function usePeriodQuery(basePath: string) {
  const router = useRouter();
  const { hydrated, get, getAll } = useHydratedSearchParams();
  const now = getJalaliNow();
  const defaults = defaultPeriod(now);

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
    updateQuery(defaultPeriod());
  }, [updateQuery]);

  const shiftMonth = useCallback(
    (delta: number) => {
      const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(delta, "jMonth");
      updateQuery({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
      });
    },
    [month, updateQuery, year],
  );

  const shiftDay = useCallback(
    (delta: number) => {
      const date = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD").add(delta, "day");
      updateQuery({
        year: String(date.jYear()),
        month: String(date.jMonth() + 1),
        day: String(date.jDate()),
      });
    },
    [day, month, updateQuery, year],
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
    now,
    updateQuery,
    goToToday,
    shiftMonth,
    shiftDay,
    shiftYear,
  };
}
