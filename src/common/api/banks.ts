import { axiosInstance } from "@/common/axiosInstance";
import type { IBank } from "@/common/interfaces/bank.interface";

export async function fetchActiveBanks() {
  const { data } = await axiosInstance.get<IBank[]>("/banks");
  return data;
}

export async function fetchAdminBanks() {
  const { data } = await axiosInstance.get<IBank[]>("/admin/banks");
  return data;
}

export async function createAdminBank(payload: {
  title: string;
  slug: string;
  parserType: string;
  active?: boolean;
  sortOrder?: number;
}) {
  const { data } = await axiosInstance.post<IBank>("/admin/banks", payload);
  return data;
}

export async function updateAdminBank(
  id: string,
  payload: Partial<{
    title: string;
    slug: string;
    parserType: string;
    active: boolean;
    sortOrder: number;
  }>,
) {
  const { data } = await axiosInstance.patch<IBank>(`/admin/banks/${id}`, payload);
  return data;
}

export async function deleteAdminBank(id: string) {
  const { data } = await axiosInstance.delete<{ message: string }>(`/admin/banks/${id}`);
  return data;
}
