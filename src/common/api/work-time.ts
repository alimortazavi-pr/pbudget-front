import { axiosInstance } from "@/common/axiosInstance";
import type {
  IProjectWorkSessions,
  IWorkMonthlyTarget,
  IWorkSession,
  IWorkTimeAlert,
  IWorkTimeDashboard,
  IWorkTimeReport,
} from "@/common/interfaces/work-time.interface";

export async function fetchWorkTimeDashboard(year: number, month: number) {
  const { data } = await axiosInstance.get<IWorkTimeDashboard>("/work-time/dashboard", {
    params: { year, month },
  });
  return data;
}

export async function fetchWorkTimeReport(year: number, month: number) {
  const { data } = await axiosInstance.get<IWorkTimeReport>("/work-time/report", {
    params: { year, month },
  });
  return data;
}

export async function fetchWorkTimeAlerts(year: number, month: number) {
  const { data } = await axiosInstance.get<{ alerts: IWorkTimeAlert[] }>(
    "/work-time/alerts",
    { params: { year, month } },
  );
  return data.alerts;
}

export async function exportWorkTimeExcel(year: number, month: number) {
  const { data } = await axiosInstance.get<Blob>("/work-time/excel-export", {
    params: { year, month },
    responseType: "blob",
  });
  return data;
}

export function downloadWorkTimeExport(blob: Blob, year: number, month: number) {
  const filename = `paradise-work-time-${year}-${month}-${Date.now()}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchMonthlyTargets(year: number, month: number) {
  const { data } = await axiosInstance.get<{ targets: IWorkMonthlyTarget[] }>(
    "/work-time/monthly-targets",
    { params: { year, month } },
  );
  return data.targets;
}

export async function upsertMonthlyTarget(payload: {
  year: number;
  month: number;
  requiredMinutes: number;
  projectId?: string;
}) {
  const { data } = await axiosInstance.put<{ target: IWorkMonthlyTarget }>(
    "/work-time/monthly-targets",
    payload,
  );
  return data.target;
}

export async function fetchProjectWorkSessions(
  projectId: string,
  year: number,
  month: number,
) {
  const { data } = await axiosInstance.get<IProjectWorkSessions>(
    `/work-time/projects/${projectId}/sessions`,
    { params: { year, month } },
  );
  return data;
}

export async function clockIn(projectId: string) {
  const { data } = await axiosInstance.post<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/clock-in`,
  );
  return data.session;
}

export async function clockOut(projectId: string) {
  const { data } = await axiosInstance.post<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/clock-out`,
  );
  return data.session;
}

export async function createManualWorkSession(
  projectId: string,
  payload: {
    year: number;
    month: number;
    day: number;
    startMinute: number;
    endMinute: number;
    description?: string;
  },
) {
  const { data } = await axiosInstance.post<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/sessions`,
    payload,
  );
  return data.session;
}

export async function updateWorkSession(
  projectId: string,
  sessionId: string,
  payload: {
    year?: number;
    month?: number;
    day?: number;
    startMinute?: number;
    endMinute?: number;
    description?: string;
  },
) {
  const { data } = await axiosInstance.patch<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/sessions/${sessionId}`,
    payload,
  );
  return data.session;
}

export async function deleteWorkSession(projectId: string, sessionId: string) {
  await axiosInstance.delete(
    `/work-time/projects/${projectId}/sessions/${sessionId}`,
  );
}

export async function attachWorkSessionBudget(
  projectId: string,
  sessionId: string,
  budgetId: string,
) {
  const { data } = await axiosInstance.post<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/sessions/${sessionId}/attach-budget`,
    { budgetId },
  );
  return data.session;
}

export async function detachWorkSessionBudget(projectId: string, sessionId: string) {
  const { data } = await axiosInstance.delete<{ session: IWorkSession }>(
    `/work-time/projects/${projectId}/sessions/${sessionId}/budget`,
  );
  return data.session;
}
