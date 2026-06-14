"use client";

import { useRouter, useSearchParams } from "next/navigation";
import moment from "moment-jalali";

import { getJalaliNow } from "@/common/utils";

export function usePeriodQuery(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = getJalaliNow();

  const year = searchParams.get("year") ?? String(now.jYear());
  const month = searchParams.get("month") ?? String(now.jMonth() + 1);
  const day = searchParams.get("day") ?? String(now.jDate());

  function updateQuery(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => params.set(key, value));
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  }

  function goToToday() {
    updateQuery({
      year: String(now.jYear()),
      month: String(now.jMonth() + 1),
      day: String(now.jDate()),
    });
  }

  function shiftMonth(delta: number) {
    const date = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(delta, "jMonth");
    updateQuery({
      year: String(date.jYear()),
      month: String(date.jMonth() + 1),
    });
  }

  function shiftDay(delta: number) {
    const date = moment(`${year}/${month}/${day}`, "jYYYY/jM/jD").add(delta, "day");
    updateQuery({
      year: String(date.jYear()),
      month: String(date.jMonth() + 1),
      day: String(date.jDate()),
    });
  }

  function shiftYear(delta: number) {
    updateQuery({ year: String(parseInt(year, 10) + delta) });
  }

  return {
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
