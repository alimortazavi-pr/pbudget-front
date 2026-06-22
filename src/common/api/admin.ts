import { axiosInstance } from "@/common/axiosInstance";
import type {
  AdminActivitySeries,
  AdminAndroidAppInfo,
  AdminAuditListResponse,
  AdminBackupInfo,
  AdminBackupRun,
  AdminBudgetItem,
  AdminCategoryItem,
  AdminCollectionMeta,
  AdminCollectionPreview,
  AdminContentListResponse,
  AdminExportFormat,
  AdminHealth,
  AdminImportMode,
  AdminOverview,
  AdminProjectItem,
  AdminUser,
  AdminUserListResponse,
} from "@/common/interfaces/admin";

export async function fetchAdminOverview() {
  const { data } = await axiosInstance.get<AdminOverview>("/admin/dashboard/overview");
  return data;
}

export async function fetchAdminActivity(days = 30) {
  const { data } = await axiosInstance.get<AdminActivitySeries>(
    "/admin/dashboard/activity",
    { params: { days } },
  );
  return data;
}

export async function fetchAdminHealth() {
  const { data } = await axiosInstance.get<AdminHealth>("/admin/dashboard/health");
  return data;
}

export async function fetchAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  adminsOnly?: boolean;
}) {
  const { data } = await axiosInstance.get<AdminUserListResponse>("/admin/users", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      includeDeleted: params.includeDeleted ? "true" : undefined,
      adminsOnly: params.adminsOnly ? "true" : undefined,
    },
  });
  return data;
}

export async function fetchAdminUser(id: string) {
  const { data } = await axiosInstance.get<AdminUser>(`/admin/users/${id}`);
  return data;
}

export async function updateAdminUser(
  id: string,
  patch: Partial<Pick<AdminUser, "firstName" | "lastName" | "budget" | "isVerifiedMobile">>,
) {
  const { data } = await axiosInstance.patch<AdminUser>(`/admin/users/${id}`, {
    firstName: patch.firstName,
    lastName: patch.lastName,
    budget: patch.budget,
    mobileActive: patch.isVerifiedMobile,
  });
  return data;
}

export async function setAdminRole(id: string, isAdmin: boolean) {
  const { data } = await axiosInstance.patch<AdminUser>(`/admin/users/${id}/admin`, {
    isAdmin,
  });
  return data;
}

export async function setUserDeleted(id: string, deleted: boolean) {
  const { data } = await axiosInstance.patch<AdminUser>(`/admin/users/${id}/deleted`, {
    deleted,
  });
  return data;
}

export async function fetchAdminCollections() {
  const { data } = await axiosInstance.get<AdminCollectionMeta[]>(
    "/admin/database/collections",
  );
  return data;
}

export async function fetchAdminDatabaseStats() {
  const { data } = await axiosInstance.get("/admin/database/stats");
  return data;
}

export async function fetchCollectionPreview(name: string, limit = 20) {
  const { data } = await axiosInstance.get<AdminCollectionPreview>(
    `/admin/database/collections/${encodeURIComponent(name)}/preview`,
    { params: { limit } },
  );
  return data;
}

export async function fetchBackupInfo() {
  const { data } = await axiosInstance.get<AdminBackupInfo>("/admin/backup/info");
  return data;
}

export async function runBackup() {
  const { data } = await axiosInstance.post("/admin/backup/run");
  return data;
}

export async function downloadAdminFile(
  path: string,
  filename: string,
  params?: Record<string, string>,
) {
  const response = await axiosInstance.get(path, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCollectionExport(
  collection: string,
  format: AdminExportFormat,
) {
  const ext = format === "csv" ? "csv" : "json";
  return downloadAdminFile(
    `/admin/database/collections/${encodeURIComponent(collection)}/export`,
    `${collection}.${ext}`,
    { format },
  );
}

export function downloadFullDatabaseExport(format: AdminExportFormat) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return downloadAdminFile("/admin/database/export-all", `pbudget-db-export-${timestamp}.zip`, {
    format,
  });
}

export async function fetchBackupHistory(page = 1, limit = 20) {
  const { data } = await axiosInstance.get<{
    items: AdminBackupRun[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("/admin/backup/history", { params: { page, limit } });
  return data;
}

export async function importBackupZip(file: File, mode: AdminImportMode) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosInstance.post("/admin/backup/import", formData, {
    params: { mode },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function importCollectionJson(
  collection: string,
  file: File,
  mode: AdminImportMode,
) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosInstance.post(
    `/admin/database/collections/${encodeURIComponent(collection)}/import`,
    formData,
    {
      params: { mode },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
}

export async function fetchAuditLogs(params: {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
}) {
  const { data } = await axiosInstance.get<AdminAuditListResponse>("/admin/audit", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 30,
      action: params.action || undefined,
      resource: params.resource || undefined,
    },
  });
  return data;
}

export async function fetchAdminBudgets(params: {
  page?: number;
  search?: string;
  includeDeleted?: boolean;
}) {
  const { data } = await axiosInstance.get<AdminContentListResponse<AdminBudgetItem>>(
    "/admin/content/budgets",
    {
      params: {
        page: params.page ?? 1,
        limit: 15,
        search: params.search || undefined,
        includeDeleted: params.includeDeleted ? "true" : undefined,
      },
    },
  );
  return data;
}

export async function updateAdminBudget(
  id: string,
  patch: Partial<Pick<AdminBudgetItem, "price" | "description" | "type" | "deleted">>,
) {
  const { data } = await axiosInstance.patch<AdminBudgetItem>(
    `/admin/content/budgets/${id}`,
    patch,
  );
  return data;
}

export async function fetchAdminCategories(params: {
  page?: number;
  search?: string;
  includeDeleted?: boolean;
}) {
  const { data } = await axiosInstance.get<AdminContentListResponse<AdminCategoryItem>>(
    "/admin/content/categories",
    {
      params: {
        page: params.page ?? 1,
        limit: 15,
        search: params.search || undefined,
        includeDeleted: params.includeDeleted ? "true" : undefined,
      },
    },
  );
  return data;
}

export async function updateAdminCategory(
  id: string,
  patch: Partial<Pick<AdminCategoryItem, "title" | "color" | "monthlyLimit" | "deleted">>,
) {
  const { data } = await axiosInstance.patch<AdminCategoryItem>(
    `/admin/content/categories/${id}`,
    patch,
  );
  return data;
}

export async function fetchAdminProjects(params: {
  page?: number;
  search?: string;
  includeDeleted?: boolean;
}) {
  const { data } = await axiosInstance.get<AdminContentListResponse<AdminProjectItem>>(
    "/admin/content/projects",
    {
      params: {
        page: params.page ?? 1,
        limit: 15,
        search: params.search || undefined,
        includeDeleted: params.includeDeleted ? "true" : undefined,
      },
    },
  );
  return data;
}

export async function updateAdminProject(
  id: string,
  patch: Partial<
    Pick<AdminProjectItem, "description" | "totalAmount" | "status" | "deleted">
  >,
) {
  const { data } = await axiosInstance.patch<AdminProjectItem>(
    `/admin/content/projects/${id}`,
    patch,
  );
  return data;
}

export async function fetchAdminAndroidAppInfo() {
  const { data } = await axiosInstance.get<AdminAndroidAppInfo>("/admin/app/android");
  return data;
}

export async function uploadAdminAndroidApk(
  file: File,
  versionName: string,
  versionCode: number,
) {
  const form = new FormData();
  form.append("file", file);
  form.append("versionName", versionName);
  form.append("versionCode", String(versionCode));
  const { data } = await axiosInstance.post<{ message: string } & AdminAndroidAppInfo>(
    "/admin/app/android/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
