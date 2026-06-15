import { axiosInstance } from "@/common/axiosInstance";
import type { IRunningTab } from "@/common/interfaces/running-tab.interface";

export async function fetchRunningTabs() {
  const { data } = await axiosInstance.get<{ tabs: IRunningTab[] }>("/running-tabs");
  return data.tabs;
}

export async function createRunningTab(payload: { title: string; amount?: string }) {
  const { data } = await axiosInstance.post<{ tab: IRunningTab }>("/running-tabs", payload);
  return data.tab;
}

export async function adjustRunningTab(id: string, delta: string) {
  const { data } = await axiosInstance.patch<{ tab: IRunningTab }>(
    `/running-tabs/${id}/adjust`,
    { delta },
  );
  return data.tab;
}

export async function clearRunningTab(id: string) {
  const { data } = await axiosInstance.post<{ tab: IRunningTab }>(`/running-tabs/${id}/clear`);
  return data.tab;
}

export async function updateRunningTab(
  id: string,
  payload: { title?: string; amount?: string },
) {
  const { data } = await axiosInstance.patch<{ tab: IRunningTab }>(
    `/running-tabs/${id}`,
    payload,
  );
  return data.tab;
}

export async function deleteRunningTab(id: string) {
  await axiosInstance.delete(`/running-tabs/${id}`);
}
