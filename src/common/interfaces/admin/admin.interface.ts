export interface AdminOverview {
  users: {
    total: number;
    active: number;
    deleted: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  transactions: {
    total: number;
    today: number;
    thisWeek: number;
  };
  database: {
    dbName: string;
    collections: number;
    documents: number;
    dataSizeBytes: number;
    storageSizeBytes: number;
    indexSizeBytes: number;
    totalSizeBytes: number;
  };
  topCollections: Array<{
    name: string;
    documentCount: number;
    estimatedSizeBytes: number;
  }>;
}

export interface AdminActivitySeries {
  days: number;
  labels: string[];
  users: number[];
  transactions: number[];
  income: number[];
  cost: number[];
}

export interface AdminHealth {
  status: "healthy" | "degraded";
  uptimeSeconds: number;
  nodeVersion: string;
  environment: string;
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    externalBytes: number;
  };
  mongodb: {
    status: "connected" | "disconnected" | "error";
    latencyMs: number | null;
    database: string | null;
  };
  backup: {
    cron: string;
    timezone: string;
    telegramEnabled: boolean;
  };
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  budget: number;
  isVerifiedMobile: boolean;
  isAdmin: boolean;
  deleted: boolean;
  hasPassword: boolean;
  telegramLinked: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCollectionMeta {
  name: string;
  documentCount: number;
  estimatedSizeBytes: number;
  indexes: number;
}

export interface AdminCollectionPreview {
  name: string;
  total: number;
  preview: unknown[];
}

export interface AdminBackupRun {
  _id?: string;
  source: string;
  status?: "success" | "failed";
  collections: number;
  documents: number;
  byteSize: number;
  filename: string;
  createdAt: string;
}

export interface AdminBackupInfo {
  schedule: {
    cron: string;
    timezone: string;
    description: string;
  };
  telegram: {
    enabled: boolean;
    maxFileSizeBytes: number;
  };
  formats: string[];
  lastRun: AdminBackupRun | null;
  recentHistory?: AdminBackupRun[];
  importHint: string;
}

export interface AdminAuditLog {
  _id: string;
  actor: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string | null;
}

export interface AdminAuditListResponse {
  items: AdminAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminContentUser {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
}

export interface AdminBudgetItem {
  _id: string;
  price: number;
  type: number;
  description: string;
  year: number;
  month: number;
  day: number;
  deleted: boolean;
  user: AdminContentUser | null;
  category: { _id: string; title: string; color: string } | null;
  createdAt: string | null;
}

export interface AdminCategoryItem {
  _id: string;
  title: string;
  color: string;
  kind: number;
  monthlyLimit: number;
  deleted: boolean;
  user: AdminContentUser | null;
  createdAt: string | null;
}

export interface AdminProjectItem {
  _id: string;
  description: string;
  totalAmount: number;
  status: number;
  fixedIncome: boolean;
  trackWorkTime: boolean;
  hourlyRate: number;
  deleted: boolean;
  user: AdminContentUser | null;
  category: { _id: string; title: string; color: string } | null;
  createdAt: string | null;
}

export interface AdminContentListResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AdminImportMode = "merge" | "replace";

export type AdminExportFormat = "ejson" | "json" | "csv";
