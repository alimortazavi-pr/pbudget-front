import type { ICategory } from "./category.interface";
import type { IProject } from "./project.interface";

export type TaskDuration = "daily" | "monthly" | "yearly";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatusFilter = "all" | "open" | "done";

export interface ITaskProjectRef {
  _id: string;
  category?: ICategory;
}

export interface ITask {
  _id: string;
  user: string;
  title: string;
  description: string;
  done: boolean;
  priority: TaskPriority;
  dueYear: number;
  dueMonth: number;
  dueDay: number;
  startHour?: number;
  endHour?: number;
  project?: ITaskProjectRef | string | null;
  routine?: string | ITaskRoutine | null;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITaskRoutine {
  _id: string;
  user: string;
  title: string;
  description: string;
  priority: TaskPriority;
  startHour?: number;
  endHour?: number;
  weekdays: number[];
  active: boolean;
  remindTelegram: boolean;
  project?: ITaskProjectRef | string | null;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITaskSummary {
  total: number;
  done: number;
  pending: number;
  overdue: number;
}

export interface ITaskListParams {
  duration: TaskDuration;
  year: string;
  month?: string;
  day?: string;
  status?: TaskStatusFilter;
  projectId?: string;
}
