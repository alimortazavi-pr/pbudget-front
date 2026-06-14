import { axiosInstance } from "@/common/axiosInstance";
import type { INoteCategory } from "@/common/interfaces/note.interface";

export async function fetchNoteCategories() {
  const { data } = await axiosInstance.get<{ categories: INoteCategory[] }>(
    "/note-categories",
  );
  return data.categories;
}

export async function createNoteCategory(payload: { title: string }) {
  const { data } = await axiosInstance.post<{ category: INoteCategory }>(
    "/note-categories",
    payload,
  );
  return data.category;
}

export async function updateNoteCategory(id: string, payload: { title: string }) {
  const { data } = await axiosInstance.put<{ category: INoteCategory }>(
    `/note-categories/${id}`,
    payload,
  );
  return data.category;
}

export async function deleteNoteCategory(id: string) {
  await axiosInstance.delete(`/note-categories/${id}`);
}
