export type ExperienceMode = "classic" | "timeline";

export const EXPERIENCE_COOKIE = "pbudget-experience";

export const EXPERIENCE_MODES: {
  id: ExperienceMode;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "کلاسیک",
    description: "همان پنل فعلی با منوی sidebar و صفحات جدا",
  },
  {
    id: "timeline",
    label: "خط زمانی",
    description: "تقویم در مرکز + ویجت‌های HMI بر اساس بازه انتخاب‌شده",
  },
];

export type PeriodDuration = "daily" | "monthly" | "yearly" | "all";

export const PERIOD_DURATIONS: { id: PeriodDuration; label: string }[] = [
  { id: "daily", label: "روز" },
  { id: "monthly", label: "ماه" },
  { id: "yearly", label: "سال" },
  { id: "all", label: "کلی" },
];
