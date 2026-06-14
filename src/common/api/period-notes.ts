import { axiosInstance } from "@/common/axiosInstance";
import type {
  IPeriodNote,
  PeriodNoteDuration,
} from "@/common/interfaces/period-note.interface";

export async function fetchPeriodNote(params: {
  duration: PeriodNoteDuration;
  year?: string;
  month?: string;
  day?: string;
}) {
  const { data } = await axiosInstance.get<{ note: IPeriodNote | null }>(
    "/period-notes",
    { params },
  );
  return data.note;
}

export async function upsertPeriodNote(payload: {
  duration: PeriodNoteDuration;
  year?: string;
  month?: string;
  day?: string;
  content: string;
}) {
  const { data } = await axiosInstance.put<{ note: IPeriodNote }>(
    "/period-notes",
    payload,
  );
  return data;
}
