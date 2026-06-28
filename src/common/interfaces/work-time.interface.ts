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

export interface IWorkDailyStatus {
  isWorkingDay: boolean;
  requiredDailyMinutes: number | null;
  monthTargetMinutes: number | null;
  workingDaysInMonth: number;
  workedTodayMinutes: number;
  remainingTodayMinutes: number | null;
  targetEndAt: string | null;
  remindAt: string | null;
}

export interface IWorkingDaysSummary {
  inMonth: number;
  elapsed: number;
  remaining: number;
  holidayCount: number;
  fridayCount: number;
}

export interface IWorkMonthlyTarget {
  _id: string;
  user: string;
  project?: IProject | string;
  year: number;
  month: number;
  requiredDailyMinutes?: number;
  requiredMinutes?: number;
  deleted: boolean;
}

export interface IWorkTimeDashboard {
  year: number;
  month: number;
  workingDays: IWorkingDaysSummary;
  workingDayList: number[];
  globalTarget: {
    requiredDailyMinutes: number | null;
    requiredMinutes: number | null;
    workedMinutes: number;
    todayWorkedMinutes: number | null;
    dailyStatus: IWorkDailyStatus | null;
  };
  activeSession: IWorkSession | null;
  activeSessionDailyStatus: IWorkDailyStatus | null;
  projects: IWorkTimeProjectRow[];
  dailyTotals: IWorkDailyTotal[];
}

export interface IWorkTimeProjectRow {
  project: IProject;
  activeSession: IWorkSession | null;
  monthWorkedMinutes: number;
  requiredDailyMinutes: number | null;
  monthTargetMinutes: number | null;
  dailyStatus: IWorkDailyStatus | null;
  dailyTotals: IWorkDailyTotal[];
}

export interface IProjectWorkSessions {
  sessions: IWorkSession[];
  activeSession: IWorkSession | null;
  monthWorkedMinutes: number;
  requiredDailyMinutes: number | null;
  monthTargetMinutes: number | null;
  workingDaysInMonth: number;
  dailyStatus: IWorkDailyStatus | null;
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
  trackWorkTime: boolean;
  workedMinutes: number;
  targetMinutes: number | null;
  completionPercent: number | null;
  receivedAmount: number;
  incomePerHour: number | null;
  hourlyRate: number | null;
  expectedEarnings: number | null;
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

export interface IClockInResult {
  session: IWorkSession;
  dailyStatus: IWorkDailyStatus;
}
