import { axiosInstance } from "@/common/axiosInstance";
import type { IBox } from "@/common/interfaces/box.interface";

export async function fetchBoxes(token?: string) {
  const { data } = await axiosInstance.get<{ boxes: IBox[] }>("/boxes", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data.boxes;
}

export async function createBox(payload: { title: string }) {
  const { data } = await axiosInstance.post("/boxes", payload);
  return data.box as IBox;
}

export async function updateBox(id: string, payload: { title: string }) {
  const { data } = await axiosInstance.put(`/boxes/${id}`, payload);
  return data.box as IBox;
}

export async function changeBoxBudget(
  id: string,
  payload: Record<string, string>,
) {
  const { data } = await axiosInstance.put(`/boxes/change-budget/${id}`, payload);
  return data;
}

export async function softDeleteBox(id: string, payload: Record<string, string>) {
  await axiosInstance.put(`/boxes/${id}/soft`, payload);
}
