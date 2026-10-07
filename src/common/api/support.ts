import { axiosInstance } from "@/common/axiosInstance";

export type SupportCategory = "general" | "billing" | "bug" | "feature" | "account";
export type SupportStatus = "open" | "answered" | "closed";

export interface SupportReply {
  _id: string;
  from: "user" | "admin";
  text: string;
  at: string;
}

export interface SupportTicket {
  _id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  category: SupportCategory;
  subject: string;
  message: string;
  source: "landing" | "app";
  status: SupportStatus;
  replies: SupportReply[];
  unreadByUser: boolean;
  lastActivityAt: string;
  createdAt: string;
  user?: string | null;
}

export async function fetchMyTickets() {
  const { data } = await axiosInstance.get<SupportTicket[]>("/support/tickets");
  return data;
}

export async function fetchUnreadSupportCount() {
  const { data } = await axiosInstance.get<{ count: number }>("/support/unread");
  return data.count;
}

export async function createTicket(payload: { category: SupportCategory; subject?: string; message: string }) {
  const { data } = await axiosInstance.post<{ id: string; code: string }>("/support/tickets", payload);
  return data;
}

export async function replyToTicket(id: string, text: string) {
  await axiosInstance.post(`/support/tickets/${id}/reply`, { text });
}

export async function markTicketRead(id: string) {
  await axiosInstance.post(`/support/tickets/${id}/read`);
}

export interface AdminTicketList {
  items: SupportTicket[];
  summary: { open: number; answered: number; closed: number };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchAdminTickets(params: { status?: string; search?: string; page?: number }) {
  const { data } = await axiosInstance.get<AdminTicketList>("/admin/support/tickets", {
    params: { status: params.status || undefined, search: params.search || undefined, page: params.page ?? 1, limit: 20 },
  });
  return data;
}

export async function adminReplyToTicket(id: string, text: string) {
  await axiosInstance.post(`/admin/support/tickets/${id}/reply`, { text });
}

export async function adminSetTicketStatus(id: string, status: "open" | "closed") {
  await axiosInstance.patch(`/admin/support/tickets/${id}/status`, { status });
}
