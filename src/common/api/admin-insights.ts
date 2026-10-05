import { axiosInstance } from "@/common/axiosInstance";
import type {
  AdminActivityResponse,
  AdminDocumentsResponse,
  AdminEngagement,
  AdminSubscriptionHistory,
  AdminUserOverview,
  AdminUserRecords,
  AdminUserRow,
  AdminUserRowsResponse,
} from "@/common/interfaces/admin";

export type AdminUserSegment =
  | "active"
  | "all"
  | "online"
  | "inactive"
  | "never"
  | "telegram"
  | "no_password"
  | "admins"
  | "deleted";

export type AdminUserSort = "newest" | "oldest" | "last_seen" | "last_login" | "name";

export async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  segment?: AdminUserSegment;
  sort?: AdminUserSort;
}) {
  const { data } = await axiosInstance.get<AdminUserRowsResponse>("/admin/users", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      segment: params.segment,
      sort: params.sort,
    },
  });
  return data;
}

export async function createUser(payload: { firstName: string; lastName: string; mobile: string; password?: string }) {
  const { data } = await axiosInstance.post<AdminUserRow>("/admin/users", payload);
  return data;
}

export async function fetchEngagement() {
  const { data } = await axiosInstance.get<AdminEngagement>("/admin/insights/engagement");
  return data;
}

export async function fetchGlobalActivity(params: { page?: number; limit?: number; includeViews?: boolean; errorsOnly?: boolean }) {
  const { data } = await axiosInstance.get<AdminActivityResponse>("/admin/insights/activity", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 40,
      includeViews: params.includeViews ? "true" : undefined,
      errorsOnly: params.errorsOnly ? "true" : undefined,
    },
  });
  return data;
}

export async function fetchUserOverview(id: string) {
  const { data } = await axiosInstance.get<AdminUserOverview>(`/admin/insights/users/${id}`);
  return data;
}

export async function fetchUserActivity(id: string, params: { page?: number; limit?: number; includeViews?: boolean; feature?: string }) {
  const { data } = await axiosInstance.get<AdminActivityResponse>(`/admin/insights/users/${id}/activity`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 40,
      includeViews: params.includeViews ? "true" : undefined,
      feature: params.feature || undefined,
    },
  });
  return data;
}

export async function fetchUserRecords(id: string, key: string, params: { page?: number; limit?: number; includeDeleted?: boolean }) {
  const { data } = await axiosInstance.get<AdminUserRecords>(`/admin/insights/users/${id}/records/${key}`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      includeDeleted: params.includeDeleted ? "true" : undefined,
    },
  });
  return data;
}

export async function setUserNote(id: string, note: string) {
  const { data } = await axiosInstance.patch<{ adminNote: string }>(`/admin/users/${id}/note`, { note });
  return data;
}

export async function revokeUserSessions(id: string) {
  await axiosInstance.post(`/admin/users/${id}/revoke-sessions`);
}

export async function adjustUserWallet(id: string, delta: number, currency?: string) {
  const { data } = await axiosInstance.post<AdminUserRow>(`/admin/users/${id}/wallet-adjust`, { delta, currency });
  return data;
}

export type AdminTransactionPayload = {
  price: string;
  type: string;
  category: string;
  year: string;
  month: string;
  day: string;
  description?: string;
  currency?: string;
};

export async function createUserTransaction(id: string, payload: AdminTransactionPayload) {
  const { data } = await axiosInstance.post(`/admin/users/${id}/transactions`, payload);
  return data;
}

export async function updateUserTransaction(id: string, budgetId: string, payload: AdminTransactionPayload) {
  const { data } = await axiosInstance.put(`/admin/users/${id}/transactions/${budgetId}`, payload);
  return data;
}

export async function deleteUserRecord(id: string, key: string, recordId: string) {
  await axiosInstance.delete(`/admin/users/${id}/records/${key}/${recordId}`);
}

export async function restoreUserRecord(id: string, key: string, recordId: string) {
  await axiosInstance.patch(`/admin/users/${id}/records/${key}/${recordId}/restore`);
}

export async function fetchUserSubscriptionHistory(id: string) {
  const { data } = await axiosInstance.get<AdminSubscriptionHistory>(`/admin/subscriptions/users/${id}`);
  return data;
}

export async function fetchDocuments(name: string, params: { page?: number; limit?: number; filter?: string; search?: string }) {
  const { data } = await axiosInstance.get<AdminDocumentsResponse>(
    `/admin/database/collections/${encodeURIComponent(name)}/documents`,
    { params: { page: params.page ?? 1, limit: params.limit ?? 25, filter: params.filter || undefined, search: params.search || undefined } },
  );
  return data;
}

export async function createDocument(name: string, document: unknown) {
  const { data } = await axiosInstance.post<Record<string, unknown>>(
    `/admin/database/collections/${encodeURIComponent(name)}/documents`,
    { document },
  );
  return data;
}

export async function updateDocument(name: string, id: string, document: unknown) {
  const { data } = await axiosInstance.patch<Record<string, unknown>>(
    `/admin/database/collections/${encodeURIComponent(name)}/documents/${encodeURIComponent(id)}`,
    { document },
  );
  return data;
}

export async function deleteDocument(name: string, id: string) {
  await axiosInstance.delete(`/admin/database/collections/${encodeURIComponent(name)}/documents/${encodeURIComponent(id)}`);
}
