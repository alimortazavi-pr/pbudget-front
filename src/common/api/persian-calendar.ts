export type PersianCalendarDay = {
  date: string;
  shamsiDate: string;
  isHoliday: boolean;
  holidayDesription: string | null;
};

type PersianCalendarResponse = {
  data?: PersianCalendarDay[];
};

/** Fetch one Jalali year through our same-origin route (avoids browser CORS). */
export async function fetchPersianCalendarYear(year: number) {
  const response = await fetch(`/api/persian-calendar/${year}`, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error("Persian calendar is temporarily unavailable");
  }

  const payload = (await response.json()) as PersianCalendarResponse;
  return Array.isArray(payload.data) ? payload.data : [];
}
