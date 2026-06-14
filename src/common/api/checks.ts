import { axiosInstance } from "@/common/axiosInstance";
import type { ICheck, ICheckSummary } from "@/common/interfaces/check.interface";

export async function fetchCheckSummary() {
  const { data } = await axiosInstance.get<ICheckSummary>("/checks/summary");
  return data;
}

export async function fetchCheckPersons() {
  const { data } = await axiosInstance.get<{ persons: string[] }>("/checks/persons");
  return data.persons;
}

export async function fetchChecks(params?: {
  duration?: string;
  year?: string;
  month?: string;
  day?: string;
  status?: string;
}) {
  const { data } = await axiosInstance.get<{ checks: ICheck[] }>("/checks", { params });
  return data;
}

export async function createCheck(payload: {
  type: string;
  amount: string;
  person: string;
  bankName?: string;
  checkNumber?: string;
  dueYear: string;
  dueMonth: string;
  dueDay: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ check: ICheck }>("/checks", payload);
  return data;
}

export async function clearCheck(
  id: string,
  payload: {
    category: string;
    amount?: string;
    year: string;
    month: string;
    day: string;
    note?: string;
  },
) {
  const { data } = await axiosInstance.post(`/checks/${id}/clear`, payload);
  return data;
}

export async function deleteCheck(id: string) {
  await axiosInstance.delete(`/checks/${id}`);
}
