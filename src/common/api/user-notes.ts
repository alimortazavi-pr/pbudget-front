import { axiosInstance } from "@/common/axiosInstance";
import type {
  INoteLine,
  IUserNote,
  NoteDuration,
  NoteLineType,
} from "@/common/interfaces/note.interface";

export async function fetchUserNoteDocuments(params: {
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

export async function fetchUserNoteDocument(params: {
  duration: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
  categoryId?: string | null;
}) {
  const { data } = await axiosInstance.get<{ note: IUserNote | null }>(
    "/user-notes/document",
    {
      params: {
        ...params,
        categoryId:
          params.categoryId === null || params.categoryId === undefined
            ? "none"
            : params.categoryId,
      },
    },
  );
  return data.note;
}

export async function upsertUserNoteDocument(payload: {
  items: INoteLine[];
  duration: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
  categoryId?: string | null;
}) {
  const { data } = await axiosInstance.put<{ note: IUserNote | null }>(
    "/user-notes/document",
    payload,
  );
  return data.note;
}

export async function appendUserNoteLine(payload: {
  text: string;
  type?: NoteLineType;
  categoryId?: string | null;
  duration?: NoteDuration;
  year?: string;
  month?: string;
  day?: string;
}) {
  const { data } = await axiosInstance.post<{ note: IUserNote; line: INoteLine }>(
    "/user-notes/line",
    payload,
  );
  return data;
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
