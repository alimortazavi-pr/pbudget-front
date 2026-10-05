import moment from "moment-jalali";

import { getJalaliNow } from "@/common/utils";

export type PeriodUnit = "year" | "month" | "day";

/** The year/month/day `delta` steps away from the given date, in the user's calendar. */
export function shiftPeriod(
  calendar: "jalali" | "gregorian",
  parts: { year: string; month: string; day: string },
  delta: number,
  unit: PeriodUnit,
) {
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10) || 1;
  if (unit === "year") return { year: String(year + delta), month: parts.month, day: parts.day };
  if (calendar === "gregorian") {
    const m = moment()
      .year(year)
      .month(month - 1)
      .date(unit === "day" ? day : 1)
      .add(delta, unit);
    return { year: String(m.year()), month: String(m.month() + 1), day: String(m.date()) };
  }
  const m = getJalaliNow()
    .jYear(year)
    .jMonth(month - 1)
    .jDate(unit === "day" ? day : 1)
    .add(delta, unit === "day" ? "day" : "jMonth");
  return { year: String(m.jYear()), month: String(m.jMonth() + 1), day: String(m.jDate()) };
}
