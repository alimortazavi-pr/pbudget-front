export type ExperienceMode = "classic" | "timeline";

export const EXPERIENCE_COOKIE = "pbudget-experience";

export const EXPERIENCE_MODES: {
  id: ExperienceMode;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    id: "classic",
    labelKey: "common.experienceClassicLabel",
    descriptionKey: "common.experienceClassicDesc",
  },
  {
    id: "timeline",
    labelKey: "common.experienceTimelineLabel",
    descriptionKey: "common.experienceTimelineDesc",
  },
];

export type PeriodDuration = "daily" | "monthly" | "yearly" | "all";

export const PERIOD_DURATIONS: { id: PeriodDuration; labelKey: string }[] = [
  { id: "daily", labelKey: "common.periodDay" },
  { id: "monthly", labelKey: "common.periodMonth" },
  { id: "yearly", labelKey: "common.periodYear" },
  { id: "all", labelKey: "common.periodAll" },
];
