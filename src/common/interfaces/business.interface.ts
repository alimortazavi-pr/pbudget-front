export type BusinessPermission =
  | "dashboard.view"
  | "transactions.view"
  | "transactions.create"
  | "transactions.edit"
  | "transactions.delete"
  | "transactions.export"
  | "categories.view"
  | "categories.manage"
  | "boxes.view"
  | "boxes.manage"
  | "debts.view"
  | "debts.create"
  | "debts.edit"
  | "debts.delete"
  | "checks.view"
  | "checks.create"
  | "checks.edit"
  | "checks.delete"
  | "installments.view"
  | "installments.manage"
  | "bank_import.view"
  | "bank_import.import"
  | "analytics.view"
  | "staff.view"
  | "staff.invite"
  | "staff.edit"
  | "staff.remove"
  | "attendance.self_clock"
  | "attendance.view_team"
  | "attendance.manage_shifts"
  | "attendance.approve_requests"
  | "attendance.reports"
  | "petty_cash.hold"
  | "petty_cash.submit"
  | "petty_cash.approve"
  | "settings.view"
  | "settings.manage"
  | "audit.view";

export type BusinessRolePreset =
  | "owner"
  | "admin"
  | "accountant"
  | "cashier"
  | "attendance_clerk"
  | "attendance_only"
  | "viewer";

export type BusinessAccessRole = "owner" | "member";

export interface IBusiness {
  _id: string;
  id?: string;
  title: string;
  description: string;
  logo?: string;
  settings?: {
    timezone: string;
    workWeekStart: number;
    geofence?: { lat: number; lng: number; radiusM: number };
    wifiSsids: string[];
    transactionApprovalThreshold?: number;
    annualLeaveDays?: number;
  };
  plan?: string;
  accessRole?: BusinessAccessRole;
  memberId?: string;
  memberPreset?: string;
  permissions?: BusinessPermission[];
}

export interface IBusinessDetail {
  business: IBusiness;
  accessRole: BusinessAccessRole;
  permissions: BusinessPermission[];
  memberId: string | null;
}

export interface IBusinessStaffMember {
  _id: string;
  id?: string;
  displayName: string;
  mobile: string;
  jobTitle: string;
  department: string;
  role: string;
  preset: string;
  permissions: BusinessPermission[];
  status: string;
  inviteLink?: string | null;
  attendanceProfile?: IAttendanceProfile | null;
}

export interface IAttendanceProfile {
  shiftTemplateId?: string;
  mode?: "fixed" | "hourly" | "flexible";
  workDays?: number[];
  startMinute?: number;
  endMinute?: number;
  minMinutesPerDay?: number;
  remoteWorkAllowed?: boolean;
}

export interface IShiftTemplate {
  _id: string;
  title: string;
  mode: "fixed" | "hourly" | "flexible" | "rotating";
  workDays: number[];
  startMinute: number;
  endMinute: number;
  minMinutesPerDay: number;
  remoteWorkAllowed: boolean;
  observeOfficialHolidays?: boolean;
  rotatingSchedule?: Array<{
    weekday: number;
    startMinute: number;
    endMinute: number;
  }>;
}

export interface ILeaveRequest {
  _id: string;
  type: string;
  status: string;
  year: number;
  month: number;
  day: number;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  startMinute?: number;
  endMinute?: number;
  manualEventType?: "clock_in" | "clock_out";
  reason: string;
  reviewNote?: string;
  member?: { displayName?: string; mobile?: string };
}

export interface IAttendanceMyProfile {
  profile: IAttendanceProfile & { shiftTitle?: string };
  profileLabel: string;
  remoteWorkAllowed: boolean;
  scheduleSummary: string;
  today: {
    year: number;
    month: number;
    day: number;
    clockedIn: boolean;
    records: unknown[];
  };
}

export interface IMonthlyAttendanceReport {
  year: number;
  month: number;
  totalWorkMinutes: number;
  totalExpectedMinutes: number;
  leaveDays: number;
  leaveMinutes: number;
  fridayCount?: number;
  holidayCount?: number;
  workingDaysInMonth?: number;
  days: {
    day: number;
    workMinutes: number;
    expectedMinutes: number;
    isWorkDay: boolean;
    dayType?: string;
    status: string;
  }[];
}

export interface IBusinessInviteInfo {
  businessTitle: string;
  displayName: string;
  inviterName: string;
  mobile: string;
  expiresAt: string;
  preset: string;
}

export interface IPendingBusinessInvite {
  id: string;
  businessId: string;
  businessTitle: string;
  displayName: string;
  preset: string;
  permissions: BusinessPermission[];
  expiresAt: string;
  inviteLink: string | null;
}

export interface IBusinessWorkspaceContext {
  businessId: string;
  title: string;
  permissions: BusinessPermission[];
  isOwner: boolean;
  role: string;
  settings?: IBusiness["settings"] | null;
  attendanceOnly?: boolean;
  memberId?: string | null;
}

export interface IBusinessDashboardSummary {
  income: number;
  cost: number;
  balance: number;
  transactionCount: number;
  staffCount: number;
  ownerId: string;
}

export interface IAttendanceTeamMember {
  memberId: string;
  displayName: string;
  mobile: string;
  status: "present" | "left" | "absent";
}
