import type { MessageTree } from "../../types";

export const projectsMessages: MessageTree = {
  clockOutRecorded: "Clock-out recorded",
  editProject: "Edit project",
  projectSaved: "Project saved",
  monthlySalaryLabel: "Monthly salary ({{currency}})",
  contractTotalLabel: "Total contract amount ({{currency}})",
  hourlyRateLabel: "Hourly rate ({{currency}})",
  clockInWithDetail: "Clock-in recorded · {{detail}}",
  progressExpenseLine: "{{percent}}% · expense {{amount}}",
  incomePerHourLine: "{{amount}} / hr (actual)",
  contractRateLine: "Contract rate: {{amount}} / hr",
  monthTargetSuffix: " · target {{duration}}",
  dailyHoursPassed:
    "Daily hours for «{{project}}» are done — record clock-out",
  dailyHoursPassedReminder:
    "30 minutes after daily hours for «{{project}}» — record clock-out",
};
