import { axiosInstance } from "@/common/axiosInstance";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IProject, IProjectDetail, IProjectItem, ProjectItemType, ProjectStatus } from "@/common/interfaces/project.interface";

export async function fetchProjects() {
  const { data } = await axiosInstance.get<{ projects: IProject[] }>("/projects");
  return data.projects;
}

export async function fetchProject(id: string) {
  const { data } = await axiosInstance.get<IProjectDetail>(`/projects/${id}`);
  return data;
}

export async function createProject(payload: {
  categoryId: string;
  totalAmount: string;
  description?: string;
  fixedIncome?: boolean;
  trackWorkTime?: boolean;
  hourlyRate?: string;
}) {
  const { data } = await axiosInstance.post<{ project: IProject }>("/projects", payload);
  return data.project;
}

export async function updateProject(
  id: string,
  payload: {
    title?: string;
    totalAmount?: string;
    status?: ProjectStatus;
    description?: string;
    fixedIncome?: boolean;
    trackWorkTime?: boolean;
    hourlyRate?: string;
  },
) {
  const { data } = await axiosInstance.patch<{ project: IProject }>(
    `/projects/${id}`,
    payload,
  );
  return data.project;
}

export async function deleteProject(id: string) {
  await axiosInstance.delete(`/projects/${id}`);
}

export async function createProjectItem(
  projectId: string,
  payload: { type: ProjectItemType; content: string },
) {
  const { data } = await axiosInstance.post<{ item: IProjectItem }>(
    `/projects/${projectId}/items`,
    payload,
  );
  return data.item;
}

export async function updateProjectItem(
  projectId: string,
  itemId: string,
  payload: { content?: string; done?: boolean },
) {
  const { data } = await axiosInstance.patch<{ item: IProjectItem }>(
    `/projects/${projectId}/items/${itemId}`,
    payload,
  );
  return data.item;
}

export async function deleteProjectItem(projectId: string, itemId: string) {
  await axiosInstance.delete(`/projects/${projectId}/items/${itemId}`);
}

export async function fetchProjectBudgetCandidates(projectId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/projects/${projectId}/budget-candidates`,
  );
  return data;
}

export async function attachProjectBudget(projectId: string, budgetId: string) {
  const { data } = await axiosInstance.post<{ budget: IBudget }>(
    `/projects/${projectId}/attach-budget`,
    { budgetId },
  );
  return data.budget;
}
