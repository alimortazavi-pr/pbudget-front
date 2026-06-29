import { axiosInstance } from "@/common/axiosInstance";
import { storage } from "@/common/utils/storage";
import type {
  IBusiness,
  IBusinessDashboardSummary,
  IBusinessDetail,
  IBusinessInviteInfo,
  IBusinessStaffMember,
  IBusinessWorkspaceContext,
  IPendingBusinessInvite,
  BusinessPermission,
  BusinessRolePreset,
  IShiftTemplate,
  ILeaveRequest,
  IAttendanceMyProfile,
  IMonthlyAttendanceReport,
} from "@/common/interfaces/business.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IBox } from "@/common/interfaces/box.interface";
import type { IDebt } from "@/common/interfaces/debt.interface";

const BUSINESS_HEADER = "X-Business-Id";

function workspaceConfig(businessId?: string) {
  const id = businessId ?? storage.getActiveBusinessId();
  if (!id) {
    throw new Error("کسب‌وکار فعال انتخاب نشده");
  }
  return { headers: { [BUSINESS_HEADER]: id } };
}

export async function fetchMyBusinesses() {
  const { data } = await axiosInstance.get<{ businesses: IBusiness[] }>(
    "/businesses",
  );
  return data.businesses;
}

export async function createBusiness(payload: {
  title: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ business: IBusiness }>(
    "/businesses",
    payload,
  );
  return data.business;
}

export async function fetchBusiness(id: string) {
  const { data } = await axiosInstance.get<IBusinessDetail>(
    `/businesses/${id}`,
  );
  return data;
}

export async function updateBusiness(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    logo: string;
    settings: {
      timezone?: string;
      workWeekStart?: number;
      geofence?: { lat: number; lng: number; radiusM: number } | null;
      transactionApprovalThreshold?: number;
      annualLeaveDays?: number;
    };
  }>,
) {
  const { data } = await axiosInstance.patch<{ business: IBusiness }>(
    `/businesses/${id}`,
    payload,
  );
  return data.business;
}

export async function deleteBusiness(id: string) {
  await axiosInstance.delete(`/businesses/${id}`);
}

export async function fetchBusinessStaff(businessId: string) {
  const { data } = await axiosInstance.get<{
    staff: IBusinessStaffMember[];
    ownerId: string;
  }>(`/businesses/${businessId}/staff`);
  return data;
}

export async function inviteBusinessStaff(
  businessId: string,
  payload: {
    displayName: string;
    mobile: string;
    jobTitle?: string;
    department?: string;
    preset?: BusinessRolePreset;
    permissions?: BusinessPermission[];
  },
) {
  const { data } = await axiosInstance.post<{
    member: IBusinessStaffMember;
    inviteLink: string | null;
  }>(`/businesses/${businessId}/staff`, payload);
  return data;
}

export async function updateBusinessStaff(
  businessId: string,
  memberId: string,
  payload: Partial<{
    displayName: string;
    jobTitle: string;
    department: string;
    preset: BusinessRolePreset;
    permissions: BusinessPermission[];
  }>,
) {
  const { data } = await axiosInstance.patch<{ member: IBusinessStaffMember }>(
    `/businesses/${businessId}/staff/${memberId}`,
    payload,
  );
  return data.member;
}

export async function removeBusinessStaff(
  businessId: string,
  memberId: string,
) {
  await axiosInstance.delete(`/businesses/${businessId}/staff/${memberId}`);
}

export async function lookupStaffMobile(mobile: string) {
  const { data } = await axiosInstance.post<{
    exists: boolean;
    displayName: string | null;
    isSelf: boolean;
  }>("/businesses/lookup-mobile", { mobile });
  return data;
}

export async function fetchPendingBusinessInvites() {
  const { data } = await axiosInstance.get<{
    invites: IPendingBusinessInvite[];
  }>("/businesses/pending-invites");
  return data.invites;
}

export async function fetchBusinessInvite(token: string) {
  const { data } = await axiosInstance.get<IBusinessInviteInfo>(
    `/business-invites/${token}`,
  );
  return data;
}

export async function acceptBusinessInvite(token: string) {
  const { data } = await axiosInstance.post<{
    message: string;
    businessId: string;
  }>(`/business-invites/${token}/accept`);
  return data;
}

export async function declineBusinessInvite(token: string) {
  await axiosInstance.post(`/business-invites/${token}/decline`);
}

export async function fetchWorkspaceContext(businessId?: string) {
  const { data } = await axiosInstance.get<IBusinessWorkspaceContext>(
    "/business/workspace/context",
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchBusinessDashboard(businessId?: string) {
  const { data } = await axiosInstance.get<{
    summary: IBusinessDashboardSummary;
  }>("/business/workspace/dashboard", workspaceConfig(businessId));
  return data.summary;
}

export async function fetchBusinessBudgets(businessId?: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    "/business/workspace/budgets",
    workspaceConfig(businessId),
  );
  return data.budgets;
}

export async function fetchBusinessCategories(businessId?: string) {
  const { data } = await axiosInstance.get<{ categories: ICategory[] }>(
    "/business/workspace/categories",
    workspaceConfig(businessId),
  );
  return data.categories;
}

export async function createBusinessCategory(
  payload: { title: string; color?: string },
  businessId?: string,
) {
  const { data } = await axiosInstance.post<{ category: ICategory }>(
    "/business/workspace/categories",
    payload,
    workspaceConfig(businessId),
  );
  return data.category;
}

export async function createBusinessBudget(
  payload: {
    price: number;
    type: number;
    categoryId?: string;
    year: number;
    month: number;
    day: number;
    description?: string;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.post<{ budget: IBudget }>(
    "/business/workspace/budgets",
    payload,
    workspaceConfig(businessId),
  );
  return data.budget;
}

export async function deleteBusinessBudget(
  budgetId: string,
  businessId?: string,
) {
  await axiosInstance.delete(
    `/business/workspace/budgets/${budgetId}`,
    workspaceConfig(businessId),
  );
}

export async function updateBusinessBudget(
  budgetId: string,
  payload: Partial<{
    price: number;
    type: number;
    categoryId: string;
    year: number;
    month: number;
    day: number;
    description: string;
  }>,
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ budget: IBudget }>(
    `/business/workspace/budgets/${budgetId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data.budget;
}

export async function reviewBusinessBudget(
  budgetId: string,
  payload: { status: "approved" | "rejected"; reviewNote?: string },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ budget: IBudget }>(
    `/business/workspace/budgets/${budgetId}/review`,
    payload,
    workspaceConfig(businessId),
  );
  return data.budget;
}

export async function fetchPendingBusinessBudgets(businessId?: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    "/business/workspace/budgets/pending",
    workspaceConfig(businessId),
  );
  return data.budgets;
}

export async function updateBusinessCategory(
  categoryId: string,
  payload: { title?: string; color?: string },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ category: ICategory }>(
    `/business/workspace/categories/${categoryId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data.category;
}

export async function deleteBusinessCategory(
  categoryId: string,
  businessId?: string,
) {
  await axiosInstance.delete(
    `/business/workspace/categories/${categoryId}`,
    workspaceConfig(businessId),
  );
}

export async function fetchBusinessBoxes(businessId?: string) {
  const { data } = await axiosInstance.get<{ boxes: IBox[] }>(
    "/business/workspace/boxes",
    workspaceConfig(businessId),
  );
  return data.boxes;
}

export async function createBusinessBox(
  payload: { title: string; budget?: number },
  businessId?: string,
) {
  const { data } = await axiosInstance.post<{ box: IBox }>(
    "/business/workspace/boxes",
    payload,
    workspaceConfig(businessId),
  );
  return data.box;
}

export async function updateBusinessBox(
  boxId: string,
  payload: { title?: string; budget?: number },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ box: IBox }>(
    `/business/workspace/boxes/${boxId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data.box;
}

export async function deleteBusinessBox(boxId: string, businessId?: string) {
  await axiosInstance.delete(
    `/business/workspace/boxes/${boxId}`,
    workspaceConfig(businessId),
  );
}

export async function fetchBusinessDebts(businessId?: string) {
  const { data } = await axiosInstance.get<{ debts: IDebt[] }>(
    "/business/workspace/debts",
    workspaceConfig(businessId),
  );
  return data.debts;
}

export async function createBusinessDebt(
  payload: {
    type: number;
    person: string;
    totalAmount: number;
    description?: string;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.post<{ debt: IDebt }>(
    "/business/workspace/debts",
    payload,
    workspaceConfig(businessId),
  );
  return data.debt;
}

export async function updateBusinessDebt(
  debtId: string,
  payload: Partial<{
    person: string;
    totalAmount: number;
    description: string;
  }>,
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ debt: IDebt }>(
    `/business/workspace/debts/${debtId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data.debt;
}

export async function deleteBusinessDebt(debtId: string, businessId?: string) {
  await axiosInstance.delete(
    `/business/workspace/debts/${debtId}`,
    workspaceConfig(businessId),
  );
}

export async function fetchMyAttendanceProfile(businessId?: string) {
  const { data } = await axiosInstance.get<IAttendanceMyProfile>(
    "/business/workspace/attendance/profile",
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchBusinessShiftTemplates(businessId?: string) {
  const { data } = await axiosInstance.get<{ templates: IShiftTemplate[] }>(
    "/business/workspace/attendance/shifts",
    workspaceConfig(businessId),
  );
  return data.templates;
}

export async function createBusinessShiftTemplate(
  payload: {
    title: string;
    mode: string;
    workDays?: number[];
    startMinute?: number;
    endMinute?: number;
    minMinutesPerDay?: number;
    remoteWorkAllowed?: boolean;
    observeOfficialHolidays?: boolean;
    rotatingSchedule?: Array<{
      weekday: number;
      startMinute: number;
      endMinute: number;
    }>;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.post<{ template: IShiftTemplate }>(
    "/business/workspace/attendance/shifts",
    payload,
    workspaceConfig(businessId),
  );
  return data.template;
}

export async function updateBusinessShiftTemplate(
  shiftId: string,
  payload: Partial<{
    title: string;
    mode: string;
    workDays: number[];
    startMinute: number;
    endMinute: number;
    minMinutesPerDay: number;
    remoteWorkAllowed: boolean;
  }>,
  businessId?: string,
) {
  const { data } = await axiosInstance.patch<{ template: IShiftTemplate }>(
    `/business/workspace/attendance/shifts/${shiftId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data.template;
}

export async function deleteBusinessShiftTemplate(
  shiftId: string,
  businessId?: string,
) {
  await axiosInstance.delete(
    `/business/workspace/attendance/shifts/${shiftId}`,
    workspaceConfig(businessId),
  );
}

export async function updateMemberAttendanceProfile(
  memberId: string,
  payload: {
    shiftTemplateId?: string | null;
    mode?: string;
    workDays?: number[];
    startMinute?: number;
    endMinute?: number;
    minMinutesPerDay?: number;
    remoteWorkAllowed?: boolean;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch(
    `/business/workspace/attendance/members/${memberId}/profile`,
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchMonthlyAttendanceReport(
  year: number,
  month: number,
  memberId?: string,
  businessId?: string,
) {
  const { data } = await axiosInstance.get<{
    member: { id: string; displayName: string };
    report: IMonthlyAttendanceReport;
  }>("/business/workspace/attendance/reports/monthly", {
    ...workspaceConfig(businessId),
    params: { year, month, memberId },
  });
  return data;
}

export async function fetchTeamMonthlyAttendanceReport(
  year: number,
  month: number,
  businessId?: string,
) {
  const { data } = await axiosInstance.get<{
    year: number;
    month: number;
    summaries: {
      memberId: string;
      displayName: string;
      totalWorkMinutes: number;
      totalExpectedMinutes: number;
      leaveDays: number;
    }[];
  }>("/business/workspace/attendance/reports/team-monthly", {
    ...workspaceConfig(businessId),
    params: { year, month },
  });
  return data;
}

export async function clockInBusiness(
  payload?: { lat?: number; lng?: number; note?: string; remoteWork?: boolean },
  businessId?: string,
) {
  const { data } = await axiosInstance.post(
    "/business/workspace/attendance/clock-in",
    payload ?? {},
    workspaceConfig(businessId),
  );
  return data;
}

export async function clockOutBusiness(
  payload?: { lat?: number; lng?: number; note?: string; remoteWork?: boolean },
  businessId?: string,
) {
  const { data } = await axiosInstance.post(
    "/business/workspace/attendance/clock-out",
    payload ?? {},
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchMyBusinessAttendance(businessId?: string) {
  const { data } = await axiosInstance.get(
    "/business/workspace/attendance/me",
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchBusinessTeamAttendance(businessId?: string) {
  const { data } = await axiosInstance.get(
    "/business/workspace/attendance/team",
    workspaceConfig(businessId),
  );
  return data;
}

export async function createBusinessLeaveRequest(
  payload: {
    type: string;
    year: number;
    month: number;
    day: number;
    endYear?: number;
    endMonth?: number;
    endDay?: number;
    startMinute?: number;
    endMinute?: number;
    manualEventType?: "clock_in" | "clock_out";
    remoteWork?: boolean;
    reason?: string;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.post(
    "/business/workspace/attendance/leave-requests",
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchBusinessLeaveRequests(businessId?: string) {
  const { data } = await axiosInstance.get<{ requests: ILeaveRequest[] }>(
    "/business/workspace/attendance/leave-requests",
    workspaceConfig(businessId),
  );
  return data.requests;
}

export async function reviewBusinessLeaveRequest(
  requestId: string,
  payload: { status: "approved" | "rejected"; reviewNote?: string },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch(
    `/business/workspace/attendance/leave-requests/${requestId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchDayAttendanceRecords(
  memberId: string,
  year: number,
  month: number,
  day: number,
  businessId?: string,
) {
  const { data } = await axiosInstance.get<{ records: unknown[] }>(
    "/business/workspace/attendance/records",
    {
      ...workspaceConfig(businessId),
      params: { memberId, year, month, day },
    },
  );
  return data.records;
}

export async function updateAttendanceRecord(
  recordId: string,
  payload: {
    minuteOfDay?: number;
    eventType?: "clock_in" | "clock_out";
    note?: string;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch(
    `/business/workspace/attendance/records/${recordId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function deleteAttendanceRecord(
  recordId: string,
  businessId?: string,
) {
  await axiosInstance.delete(
    `/business/workspace/attendance/records/${recordId}`,
    workspaceConfig(businessId),
  );
}

export async function exportBusinessAttendanceExcel(
  year: number,
  month: number,
  memberId?: string,
  businessId?: string,
) {
  const { data } = await axiosInstance.get<Blob>(
    "/business/workspace/attendance/reports/excel-export",
    {
      ...workspaceConfig(businessId),
      params: { year, month, memberId },
      responseType: "blob",
    },
  );
  return data;
}

export function downloadBusinessAttendanceExport(
  blob: Blob,
  year: number,
  month: number,
) {
  const filename = `paradise-attendance-${year}-${month}-${Date.now()}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchPettyCashAccounts(businessId?: string) {
  const { data } = await axiosInstance.get(
    "/business/workspace/petty-cash/accounts",
    workspaceConfig(businessId),
  );
  return data;
}

export async function createPettyCashAccount(
  payload: { holderMemberId: string; title: string; limit: number },
  businessId?: string,
) {
  const { data } = await axiosInstance.post(
    "/business/workspace/petty-cash/accounts",
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function submitPettyCashExpense(
  payload: {
    accountId: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
  },
  businessId?: string,
) {
  const { data } = await axiosInstance.post(
    "/business/workspace/petty-cash/expenses",
    payload,
    workspaceConfig(businessId),
  );
  return data;
}

export async function fetchPettyCashExpenses(businessId?: string) {
  const { data } = await axiosInstance.get(
    "/business/workspace/petty-cash/expenses",
    workspaceConfig(businessId),
  );
  return data;
}

export async function reviewPettyCashExpense(
  expenseId: string,
  payload: { status: "approved" | "rejected" },
  businessId?: string,
) {
  const { data } = await axiosInstance.patch(
    `/business/workspace/petty-cash/expenses/${expenseId}`,
    payload,
    workspaceConfig(businessId),
  );
  return data;
}
