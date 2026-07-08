export {};

declare module "moment" {
  interface Moment {
    jYear(): number;
    jYear(year: number): this;
    jMonth(): number;
    jMonth(month: number): this;
    jDate(): number;
    jDate(date: number): this;
    add(
      amount?: moment.DurationInputArg1,
      unit?: moment.unitOfTime.DurationConstructor | "jYear" | "jMonth" | "jWeek" | "jDay",
    ): this;
  }
}
