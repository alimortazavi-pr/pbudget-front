/**
 * Presentation modes only. They intentionally do not change the data model or
 * the available account capabilities; they change how the home experience is
 * laid out for different comfort levels.
 */
export type AppMode = "advanced" | "calendar" | "command" | "notebook";

export const APP_MODE_COOKIE = "pbudget-app-mode";

export const APP_MODES: {
  id: AppMode;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    id: "advanced",
    labelKey: "common.appModeAdvancedLabel",
    descriptionKey: "common.appModeAdvancedDesc",
  },
  {
    id: "calendar",
    labelKey: "common.appModeCalendarLabel",
    descriptionKey: "common.appModeCalendarDesc",
  },
  {
    id: "command",
    labelKey: "common.appModeCommandLabel",
    descriptionKey: "common.appModeCommandDesc",
  },
  {
    id: "notebook",
    labelKey: "common.appModeNotebookLabel",
    descriptionKey: "common.appModeNotebookDesc",
  },
];
