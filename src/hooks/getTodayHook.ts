import moment from "jalali-moment";

export function useToday() {
  const now = moment().locale("fa");
  const duration = "monthly";
  const year = now.year();
  const month = now.month() + 1;

  return { duration, year, month };
}
