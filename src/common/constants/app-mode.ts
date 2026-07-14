export type AppMode = "simple" | "advanced";

export const APP_MODE_COOKIE = "pbudget-app-mode";

export const APP_MODES: {
  id: AppMode;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    id: "simple",
    labelKey: "common.appModeSimpleLabel",
    descriptionKey: "common.appModeSimpleDesc",
  },
  {
    id: "advanced",
    labelKey: "common.appModeAdvancedLabel",
    descriptionKey: "common.appModeAdvancedDesc",
  },
];
