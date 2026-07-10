import type { MessageTree } from "../../types";

export const pageHeroMessages: MessageTree = {
  shared: {
    backToProject: "Back to project",
    allProjectsLink: "All projects",
    enableTimeTrackingHint:
      "You can enable time tracking in the project settings.",
  },
  notes: {
    eyebrow: "Financial notes",
    description:
      "Free-form text and checklists on one page, categorized separately from transactions.",
    durationGeneral: "General",
  },
  tasks: {
    eyebrow: "Planning & tracking",
    description:
      "Daily, monthly, and yearly plans — all with calendar dates and links to projects.",
  },
  workAttendance: {
    eyebrow: "Projects",
    title: "Work attendance",
    description:
      "Set daily hours per project — monthly targets account for Fridays and public holidays.",
    tabToday: "Today",
    tabAllProjects: "All projects",
    todayProjectsTitle: "Today's projects",
    allProjectsTitle: "Projects",
    noActiveProjectsToday:
      "Today is not a working day or you have no active projects.",
    todayWorked: "Today: {{duration}}",
    todayWorkedInline: " · Today {{duration}}",
    dailyHoursSum: "Total daily hours across projects:",
    setDailyHoursHint: "Set daily hours for each project in its details.",
    dailyHoursNotSet: "Daily hours not set — configure in project details",
  },
  projects: {
    eyebrow: "Project management",
    description:
      "See total contract value, small payments, and meeting notes in one place.",
  },
  projectAttendance: {
    eyebrow: "Project attendance",
    description:
      "Clock in/out, manual time entry, and work analytics for this project",
    disabledDescription: "This project does not require time tracking.",
  },
  installments: {
    eyebrow: "Financial planning",
    description:
      "Create payment plans; view installments, payments, and transactions on each plan page.",
  },
  checks: {
    eyebrow: "Check management",
    description:
      "Record incoming and outgoing checks with due dates and automatic settlement to transactions.",
    recordButton: "Record check",
  },
  commitments: {
    eyebrow: "Running commitments",
    description:
      "Amounts that keep changing — charity, tips, or small debts not yet finalized.",
  },
  debts: {
    eyebrow: "Financial commitments",
    description:
      "Open any receivable or debt; view settlements, transactions, and analysis on one page.",
  },
  analysis: {
    eyebrow: "Financial analysis hub",
    title: "Comprehensive financial analysis",
    description:
      "Interactive income and expense charts, category breakdowns, trends, and actionable insights.",
    loading: "Preparing analysis and charts…",
    noData: "No chart data available to display.",
  },
  ventures: {
    eyebrow: "Partnership & collaboration",
    title: "Businesses & partners",
    description:
      "For partnerships beyond projects — restaurants, shops, joint investments, and more.",
    newButton: "New business",
  },
  invites: {
    title: "Collaboration invites",
    description: "Project collaboration invites — accept or decline",
    pendingCount: "{{count}} pending invites",
  },
};
