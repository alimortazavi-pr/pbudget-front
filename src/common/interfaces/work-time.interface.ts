import type { IBudget } from "./budget.interface";
import type { IProject } from "./project.interface";

export type WorkSessionEntryType = "clock" | "manual";

export interface IWorkSession {
  _id: string;
  user: string;
  project: string;
  year: number;
  month: number;
  day: number;
  startMinute: number;
  endMinute?: number;
  durationMinutes?: number;
  entryType: WorkSessionEntryType;
  clockInAt?: string;
  clockOutAt?: string;
  description: string;
  budget?: IBudget | string;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IWorkDailyTotal {
  day: number;
  minutes: number;
}

export interface IWorkMonthlyTarget {
  _id: string;
  user: string;
  project?: IProject | string;
  year: number;
  month: number;
  requiredMinutes: number;
  deleted: boolean;
}

export interface IWorkTimeDashboard {
  year: number;
  month: number;
  globalTarget: {
    requiredMinutes: number | null;
    workedMinutes: number;
  };
  activeSession: IWorkSession | null;
  projects: IWorkTimeProjectRow[];
  dailyTotals: IWorkDailyTotal[];
}

export interface IWorkTimeProjectRow {
  project: IProject;
  activeSession: IWorkSession | null;
  monthWorkedMinutes: number;
  monthTargetMinutes: number | null;
  dailyTotals: IWorkDailyTotal[];
}

export interface IProjectWorkSessions {
  sessions: IWorkSession[];
  activeSession: IWorkSession | null;
  monthWorkedMinutes: number;
  monthTargetMinutes: number | null;
  dailyTotals: IWorkDailyTotal[];
}

export interface IWorkWeeklyTotal {
  week: number;
  label: string;
  startDay: number;
  endDay: number;
  minutes: number;
}

export interface IWorkProjectAnalysis {
  projectId: string;
  title: string;
  fixedIncome: boolean;
  workedMinutes: number;
  targetMinutes: number | null;
  completionPercent: number | null;
  receivedAmount: number;
  incomePerHour: number | null;
  sessionCount: number;
}

export interface IWorkTimeInsight {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
}

export type WorkTimeAlertAction =
  | "clock-out"
  | "open-project"
  | "view-attendance"
  | "set-target";

export interface IWorkTimeAlert {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  action?: WorkTimeAlertAction;
  projectId?: string;
}

export interface IWorkTimeMonthComparison {
  previousPeriodLabel: string;
  previousWorkedMinutes: number;
  previousTargetMinutes: number | null;
  workedChangePercent: number;
}

export interface IWorkTimeReport {
  year: number;
  month: number;
  periodLabel: string;
  daysInMonth: number;
  globalWorkedMinutes: number;
  globalTargetMinutes: number | null;
  weeklyTotals: IWorkWeeklyTotal[];
  dailyTotals: IWorkDailyTotal[];
  projectAnalysis: IWorkProjectAnalysis[];
  insights: IWorkTimeInsight[];
  comparison?: IWorkTimeMonthComparison;
  projectId?: string;
  projectTitle?: string;
  fixedIncome?: boolean;
}
