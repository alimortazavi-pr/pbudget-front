import type { MySubscriptionResponse, UserSubscription } from "@/common/interfaces/subscription.interface";

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

export type WalletBalances = { toman: number; usd: number; dinar: number };

export type ActivityKind = "auth" | "create" | "update" | "delete" | "view";

export interface AdminActivityItem {
  _id: string;
  userId: string | null;
  userName: string | null;
  label: string;
  feature: string;
  featureLabel: string;
  kind: ActivityKind;
  detail: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  ok: boolean;
  durationMs: number | null;
  ip: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  createdAt: string | null;
}

export interface AdminActivityResponse {
  items: AdminActivityItem[];
  pagination: Pagination;
}

export interface AdminEngagement {
  users: {
    total: number;
    dau: number;
    wau: number;
    mau: number;
    neverSeen: number;
    dormant: number;
    telegram: number;
    withPassword: number;
  };
  adoption: { key: string; label: string; feature: string; users: number; share: number }[];
  topUsers: { _id: string; name: string; mobile: string | null; lastSeenAt: string | null; transactions30d: number }[];
  topActions: { label: string; feature: string; featureLabel: string; count: number; users: number }[];
  health: { requests24h: number; errors24h: number };
}

export interface AdminUserRow {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  budget: number;
  walletBalances: WalletBalances;
  isVerifiedMobile: boolean;
  isAdmin: boolean;
  deleted: boolean;
  hasPassword: boolean;
  telegramLinked: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  transactionCount?: number;
  lastTransactionAt?: string | null;
  plan?: { name: string; slug: string; expiresAt: string | null } | null;
}

export interface AdminUserRowsResponse {
  items: AdminUserRow[];
  pagination: Pagination;
}

export interface AdminUserOverview {
  user: AdminUserRow & {
    deletedAt: string | null;
    preferences: { currency: string; dateCalendar: string; moneyDisplayUnit: string; configured: boolean };
    adminNote: string;
    sessionRevoked: boolean;
  };
  counts: Record<string, number>;
  collections: { key: string; label: string; count: number }[];
  ledger: { currency: string; income: number; cost: number; net: number; count: number }[];
  transactionsLast30Days: number;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
  openDebts: { type: "receivable" | "payable"; currency: string; remaining: number; count: number }[];
  subscription: MySubscriptionResponse;
  logins: { _id: string; action: string; ip: string | null; userAgent: string | null; createdAt: string | null }[];
  devices: { userAgent: string; lastSeen: string; requests: number }[];
}

export interface AdminUserRecords {
  key: string;
  label: string;
  items: Record<string, unknown>[];
  pagination: Pagination;
}

export interface AdminSubscriptionHistory {
  current: MySubscriptionResponse;
  history: UserSubscription[];
}

export interface AdminDocumentsResponse {
  name: string;
  readOnly: boolean;
  items: Record<string, unknown>[];
  pagination: Pagination;
}
