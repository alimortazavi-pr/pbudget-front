import { axiosInstance } from "@/common/axiosInstance";
import type {
  IUserNote,
  NoteDuration,
} from "@/common/interfaces/note.interface";

export async function fetchUserNotes(params: {
  duration?: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
  categoryId?: string;
}) {
  const { data } = await axiosInstance.get<{ notes: IUserNote[] }>(
    "/user-notes",
    { params },
  );
  return data.notes;
}

export async function createUserNote(payload: {
  text: string;
  categoryId?: string | null;
  duration?: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
}) {
  const { data } = await axiosInstance.post<{ note: IUserNote }>(
    "/user-notes",
    payload,
  );
  return data.note;
}

export async function updateUserNote(
  id: string,
  payload: { text?: string; done?: boolean; categoryId?: string | null },
) {
  const { data } = await axiosInstance.patch<{ note: IUserNote }>(
    `/user-notes/${id}`,
    payload,
  );
  return data.note;
}

export async function toggleUserNote(id: string) {
  const { data } = await axiosInstance.patch<{ note: IUserNote }>(
    `/user-notes/${id}/toggle`,
  );
  return data.note;
}

export async function deleteUserNote(id: string) {
  await axiosInstance.delete(`/user-notes/${id}`);
}

export async function clearUserNotes(payload: {
  duration?: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
  categoryId?: string | null;
}) {
  const { data } = await axiosInstance.post<{ message: string }>(
    "/user-notes/clear",
    payload,
  );
  return data;
}
