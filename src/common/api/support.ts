import { axiosInstance } from "@/common/axiosInstance";

export type SupportCategory = "general" | "billing" | "bug" | "feature" | "account";
export type SupportStatus = "open" | "answered" | "closed";
export type SupportPriority = "low" | "normal" | "high" | "urgent";
export type SupportScope = "user" | "admin";

export const SUPPORT_CATEGORIES: SupportCategory[] = ["billing", "bug", "account", "feature", "general"];
export const SUPPORT_PRIORITIES: SupportPriority[] = ["urgent", "high", "normal", "low"];
export const SUPPORT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv";
export const SUPPORT_MAX_ATTACHMENTS = 5;

export interface SupportAttachment {
  _id: string;
  name: string;
  mime: string;
  size: number;
}

export interface SupportThreadItem {
  _id: string;
  from: "user" | "admin";
  text: string;
  at: string;
  authorName: string;
  internal: boolean;
  attachments: SupportAttachment[];
}

export interface SupportLastMessage {
  from: "user" | "admin";
  text: string;
  at: string;
  internal?: boolean;
}

/** A conversation as the user sees it (internal notes are never included). */
export interface SupportTicket {
  _id: string;
  code: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  startedBy: "user" | "admin";
  unreadByUser: boolean;
  adminSeenAt: string | null;
  rating: number | null;
  ratingComment: string;
  lastActivityAt: string;
  createdAt: string;
  closedAt: string | null;
  lastMessage: SupportLastMessage | null;
  thread: SupportThreadItem[];
}

export interface AdminTicketListItem {
  _id: string;
  code: string;
  user: string | null;
  name: string;
  email: string;
  phone: string;
  category: SupportCategory;
  subject: string;
  source: "landing" | "app" | "admin";
  startedBy: "user" | "admin";
  status: SupportStatus;
  priority: SupportPriority;
  assignedTo: string | null;
  tags: string[];
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  rating: number | null;
  lastActivityAt: string;
  lastMessageFrom: "user" | "admin";
  createdAt: string;
  messageCount: number;
  lastMessage: SupportLastMessage | null;
}

export interface AdminTicketDetail extends AdminTicketListItem {
  userSeenAt: string | null;
  adminSeenAt: string | null;
  firstResponseAt: string | null;
  closedAt: string | null;
  closedBy: "user" | "admin" | null;
  ratingComment: string;
  thread: SupportThreadItem[];
}

export interface AdminSupportSummary {
  open: number;
  answered: number;
  closed: number;
  unread: number;
  mine: number;
  unassigned: number;
  urgent: number;
  ratingAverage: number | null;
  ratingCount: number;
}

export interface AdminTicketList {
  items: AdminTicketListItem[];
  summary: AdminSupportSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface SupportPulse {
  unread: number;
  open?: number;
  stamp: string | null;
}

export interface SupportCannedReply {
  _id: string;
  title: string;
  text: string;
  category: string;
  usageCount: number;
}

// ---- Shared ----------------------------------------------------------------

const base = (scope: SupportScope) => (scope === "admin" ? "/admin/support" : "/support");

export async function uploadSupportAttachment(scope: SupportScope, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosInstance.post<SupportAttachment>(`${base(scope)}/attachments`, form);
  return data;
}

const blobCache = new Map<string, Promise<string>>();

/** Object URL for a private attachment (fetched with the session token, cached for the page's life). */
export function supportAttachmentUrl(scope: SupportScope, id: string) {
  const key = `${scope}:${id}`;
  let cached = blobCache.get(key);
  if (!cached) {
    cached = axiosInstance
      .get<Blob>(`${base(scope)}/attachments/${id}`, { responseType: "blob" })
      .then(({ data }) => URL.createObjectURL(data));
    cached.catch(() => blobCache.delete(key));
    blobCache.set(key, cached);
  }
  return cached;
}

// ---- User ------------------------------------------------------------------

export async function fetchMyTickets() {
  const { data } = await axiosInstance.get<SupportTicket[]>("/support/tickets");
  return data;
}

export async function fetchMyTicket(id: string) {
  const { data } = await axiosInstance.get<SupportTicket>(`/support/tickets/${id}`);
  return data;
}

export async function fetchUnreadSupportCount() {
  const { data } = await axiosInstance.get<{ count: number }>("/support/unread");
  return data.count;
}

export async function fetchSupportPulse() {
  const { data } = await axiosInstance.get<SupportPulse>("/support/pulse");
  return data;
}

export async function createTicket(payload: {
  category: SupportCategory;
  subject?: string;
  message: string;
  attachmentIds?: string[];
}) {
  const { data } = await axiosInstance.post<{ id: string; code: string }>("/support/tickets", payload);
  return data;
}

export async function replyToTicket(id: string, payload: { text?: string; attachmentIds?: string[] }) {
  const { data } = await axiosInstance.post<SupportTicket>(`/support/tickets/${id}/reply`, payload);
  return data;
}

export async function markTicketRead(id: string) {
  await axiosInstance.post(`/support/tickets/${id}/read`);
}

export async function closeMyTicket(id: string) {
  const { data } = await axiosInstance.post<SupportTicket>(`/support/tickets/${id}/close`);
  return data;
}

export async function rateTicket(id: string, rating: number, comment?: string) {
  const { data } = await axiosInstance.post<SupportTicket>(`/support/tickets/${id}/rate`, { rating, comment });
  return data;
}

// ---- Admin -----------------------------------------------------------------

export interface AdminTicketQuery {
  status?: "" | "active" | SupportStatus;
  search?: string;
  priority?: "" | SupportPriority;
  category?: "" | SupportCategory;
  source?: "" | "landing" | "app" | "admin";
  assignee?: string;
  unread?: boolean;
  userId?: string;
  sort?: "" | "oldest" | "created" | "priority";
  page?: number;
}

export async function fetchAdminTickets(params: AdminTicketQuery) {
  const { data } = await axiosInstance.get<AdminTicketList>("/admin/support/tickets", {
    params: {
      status: params.status || undefined,
      search: params.search || undefined,
      priority: params.priority || undefined,
      category: params.category || undefined,
      source: params.source || undefined,
      assignee: params.assignee || undefined,
      unread: params.unread ? "1" : undefined,
      userId: params.userId || undefined,
      sort: params.sort || undefined,
      page: params.page ?? 1,
      limit: 25,
    },
  });
  return data;
}

export async function fetchAdminTicket(id: string) {
  const { data } = await axiosInstance.get<AdminTicketDetail>(`/admin/support/tickets/${id}`);
  return data;
}

export async function fetchAdminSupportPulse() {
  const { data } = await axiosInstance.get<SupportPulse>("/admin/support/pulse");
  return data;
}

export async function adminMarkTicketRead(id: string) {
  await axiosInstance.post(`/admin/support/tickets/${id}/read`);
}

export async function adminReplyToTicket(
  id: string,
  payload: { text?: string; attachmentIds?: string[]; internal?: boolean; close?: boolean },
) {
  const { data } = await axiosInstance.post<AdminTicketDetail>(`/admin/support/tickets/${id}/reply`, payload);
  return data;
}

export async function adminUpdateTicket(
  id: string,
  payload: {
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    assignedTo?: string | null;
    tags?: string[];
  },
) {
  const { data } = await axiosInstance.patch<AdminTicketDetail>(`/admin/support/tickets/${id}`, payload);
  return data;
}

export async function adminSetTicketStatus(id: string, status: "open" | "closed") {
  return adminUpdateTicket(id, { status });
}

export async function adminStartTicket(payload: {
  userId: string;
  subject?: string;
  category?: SupportCategory;
  priority?: SupportPriority;
  text: string;
  attachmentIds?: string[];
}) {
  const { data } = await axiosInstance.post<AdminTicketDetail>("/admin/support/tickets", payload);
  return data;
}

export async function fetchSupportAdmins() {
  const { data } = await axiosInstance.get<{ _id: string; name: string }[]>("/admin/support/admins");
  return data;
}

export async function fetchCannedReplies() {
  const { data } = await axiosInstance.get<SupportCannedReply[]>("/admin/support/canned");
  return data;
}

export async function saveCannedReply(payload: { title: string; text: string; category?: string }, id?: string) {
  const { data } = id
    ? await axiosInstance.patch<SupportCannedReply>(`/admin/support/canned/${id}`, payload)
    : await axiosInstance.post<SupportCannedReply>("/admin/support/canned", payload);
  return data;
}

export async function deleteCannedReply(id: string) {
  await axiosInstance.delete(`/admin/support/canned/${id}`);
}

export async function markCannedReplyUsed(id: string) {
  await axiosInstance.post(`/admin/support/canned/${id}/use`);
}
