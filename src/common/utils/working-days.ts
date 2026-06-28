import {
  getJalaliDaysInMonth,
  getJalaliWeekdayIndex,
} from "./jalali-date";
import {
  IRAN_FIXED_SOLAR_HOLIDAYS,
  IRAN_OFFICIAL_HOLIDAYS,
} from "./iran-jalali-holidays.data";

export const FRIDAY_WEEKDAY = 6;

function holidayKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

function buildHolidaySet(year: number) {
  const set = new Set<string>();
  IRAN_FIXED_SOLAR_HOLIDAYS.forEach(({ month, day }) => {
    if (day <= getJalaliDaysInMonth(year, month)) {
      set.add(holidayKey(year, month, day));
    }
  });
  (IRAN_OFFICIAL_HOLIDAYS[year] ?? []).forEach(({ month, day }) => {
    if (day <= getJalaliDaysInMonth(year, month)) {
      set.add(holidayKey(year, month, day));
    }
  });
  return set;
}

export function isOfficialHoliday(year: number, month: number, day: number) {
  return buildHolidaySet(year).has(holidayKey(year, month, day));
}

export function isFriday(year: number, month: number, day: number) {
  return getJalaliWeekdayIndex(year, month, day) === FRIDAY_WEEKDAY;
}

export function isWorkingDay(year: number, month: number, day: number) {
  if (isFriday(year, month, day)) return false;
  if (isOfficialHoliday(year, month, day)) return false;
  return true;
}

export function countWorkingDaysInMonth(year: number, month: number) {
  const daysInMonth = getJalaliDaysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    if (isWorkingDay(year, month, day)) count += 1;
  }
  return count;
}

export function getWorkingDaysSummary(year: number, month: number, upToDay: number) {
  const daysInMonth = getJalaliDaysInMonth(year, month);
  const capped = Math.min(Math.max(upToDay, 0), daysInMonth);
  let fridayCount = 0;
  let holidayCount = 0;
  let inMonth = 0;
  let elapsed = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (isFriday(year, month, day)) fridayCount += 1;
    else if (isOfficialHoliday(year, month, day)) holidayCount += 1;
    else inMonth += 1;
    if (day <= capped && isWorkingDay(year, month, day)) elapsed += 1;
  }

  return {
    inMonth,
    elapsed,
    remaining: Math.max(inMonth - elapsed, 0),
    holidayCount,
    fridayCount,
    offDays: fridayCount + holidayCount,
  };
}

export function computeMonthlyTargetFromDaily(
  requiredDailyMinutes: number,
  year: number,
  month: number,
) {
  return requiredDailyMinutes * countWorkingDaysInMonth(year, month);
}
