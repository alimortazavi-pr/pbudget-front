import moment from "moment-jalali";

import type { IDebt } from "@/common/interfaces/debt.interface";

/** Whole days from today until the debt's due date (negative = overdue). */
export function daysUntilDue(debt: Pick<IDebt, "dueYear" | "dueMonth" | "dueDay" | "dateCalendar">): number | null {
  if (!debt.dueYear || !debt.dueMonth || !debt.dueDay) return null;
  const due =
    debt.dateCalendar === "gregorian"
      ? moment(`${debt.dueYear}-${debt.dueMonth}-${debt.dueDay}`, "YYYY-M-D")
      : moment(`${debt.dueYear}/${debt.dueMonth}/${debt.dueDay}`, "jYYYY/jM/jD");
  if (!due.isValid()) return null;
  return due.startOf("day").diff(moment().startOf("day"), "days");
}

export type DueTone = "overdue" | "today" | "soon" | "later";

export function dueTone(days: number): DueTone {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "later";
}
