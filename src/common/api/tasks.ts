import { axiosInstance } from "@/common/axiosInstance";
import type {
  ITask,
  ITaskListParams,
  ITaskRoutine,
  ITaskSummary,
  TaskPriority,
} from "@/common/interfaces/task.interface";
import { toEnglishDigits } from "@/common/utils/persian-digits";

function buildParams(params: ITaskListParams) {
  const query: Record<string, string> = {
    duration: params.duration,
    year: toEnglishDigits(params.year),
  };
  if (params.month) query.month = toEnglishDigits(params.month);
  if (params.day) query.day = toEnglishDigits(params.day);
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.projectId) query.projectId = params.projectId;
  return query;
}

export async function fetchTaskSummary(params: ITaskListParams) {
  const { data } = await axiosInstance.get<ITaskSummary>("/tasks/summary", {
    params: buildParams(params),
  });
  return data;
}

export async function fetchTasks(params: ITaskListParams) {
  const { data } = await axiosInstance.get<{ tasks: ITask[] }>("/tasks", {
    params: buildParams(params),
  });
  return data.tasks;
}

export async function createTask(payload: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueYear: string;
  dueMonth: string;
  dueDay: string;
  projectId?: string | null;
}) {
  const { data } = await axiosInstance.post<{ task: ITask }>("/tasks", payload);
  return data.task;
}

export async function updateTask(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    done: boolean;
    priority: TaskPriority;
    dueYear: string;
    dueMonth: string;
    dueDay: string;
    projectId: string | null;
  }>,
) {
  const { data } = await axiosInstance.patch<{ task: ITask }>(
    `/tasks/${id}`,
    payload,
  );
  return data.task;
}

export async function toggleTask(id: string) {
  const { data } = await axiosInstance.post<{ task: ITask }>(
    `/tasks/${id}/toggle`,
  );
  return data.task;
}

export async function deleteTask(id: string) {
  await axiosInstance.delete(`/tasks/${id}`);
}

export async function fetchTaskRoutines() {
  const { data } = await axiosInstance.get<{ routines: ITaskRoutine[] }>(
    "/tasks/routines",
  );
  return data.routines;
}

export async function createTaskRoutine(payload: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  projectId?: string | null;
  startHour?: number;
  endHour?: number;
  weekdays?: number[];
  active?: boolean;
  remindTelegram?: boolean;
}) {
  const { data } = await axiosInstance.post<{ routine: ITaskRoutine }>(
    "/tasks/routines",
    payload,
  );
  return data.routine;
}

export async function updateTaskRoutine(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    priority: TaskPriority;
    projectId: string | null;
    startHour: number;
    endHour: number;
    weekdays: number[];
    active: boolean;
    remindTelegram: boolean;
  }>,
) {
  const { data } = await axiosInstance.patch<{ routine: ITaskRoutine }>(
    `/tasks/routines/${id}`,
    payload,
  );
  return data.routine;
}

export async function deleteTaskRoutine(id: string) {
  await axiosInstance.delete(`/tasks/routines/${id}`);
}
