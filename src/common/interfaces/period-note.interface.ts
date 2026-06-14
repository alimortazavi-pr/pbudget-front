export type PeriodNoteDuration = "daily" | "monthly" | "yearly" | "general";

export interface IPeriodNote {
  _id: string;
  duration: PeriodNoteDuration;
  year: number;
  month: number;
  day?: number;
  content: string;
}
