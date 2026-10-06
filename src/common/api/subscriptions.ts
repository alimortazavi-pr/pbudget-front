import { axiosInstance } from "@/common/axiosInstance";
import type { MySubscriptionResponse, SubscriptionPlan, UserSubscription } from "@/common/interfaces/subscription.interface";

export async function fetchPublicSubscriptionPlans() {
  const { data } = await axiosInstance.get<SubscriptionPlan[]>("/subscriptions/plans");
  return data;
}

export async function fetchMySubscription() {
  const { data } = await axiosInstance.get<MySubscriptionResponse>("/subscriptions/me");
  return data;
}

export async function fetchMySubscriptionHistory() {
  const { data } = await axiosInstance.get<UserSubscription[]>("/subscriptions/me/history");
  return data;
}

/** Hands a Cafe Bazaar purchase to the server, which verifies it with Bazaar. */
export async function verifyBazaarPurchase(payload: { productId: string; purchaseToken: string; orderId?: string }) {
  const { data } = await axiosInstance.post<UserSubscription>("/subscriptions/bazaar/verify", payload);
  return data;
}

export async function fetchAdminSubscriptionPlans() {
  const { data } = await axiosInstance.get<SubscriptionPlan[]>("/admin/subscriptions/plans");
  return data;
}

export async function createAdminSubscriptionPlan(payload: Omit<SubscriptionPlan, "_id" | "active" | "sortOrder"> & Partial<Pick<SubscriptionPlan, "active" | "sortOrder">>) {
  const { data } = await axiosInstance.post<SubscriptionPlan>("/admin/subscriptions/plans", payload);
  return data;
}

// The plan slug is the immutable identifier used by the backend update DTO.
// Keeping it out of this type prevents accidentally sending it in PATCH requests.
export async function updateAdminSubscriptionPlan(id: string, payload: Partial<Omit<SubscriptionPlan, "_id" | "slug">>) {
  const { data } = await axiosInstance.patch<SubscriptionPlan>(`/admin/subscriptions/plans/${id}`, payload);
  return data;
}

export async function archiveAdminSubscriptionPlan(id: string) {
  const { data } = await axiosInstance.delete<SubscriptionPlan>(`/admin/subscriptions/plans/${id}`);
  return data;
}

export async function fetchAdminSubscriptions(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await axiosInstance.get<{ items: UserSubscription[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/admin/subscriptions", { params });
  return data;
}

export async function assignAdminSubscription(payload: { userId: string; planId: string; startsAt?: string; expiresAt?: string | null; note?: string }) {
  const { data } = await axiosInstance.post<UserSubscription>("/admin/subscriptions", payload);
  return data;
}

export async function revokeAdminSubscription(id: string) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}/revoke`);
  return data;
}

export async function requestSubscription(planId: string, note?: string) {
  const { data } = await axiosInstance.post<UserSubscription>("/subscriptions/requests", { planId, note });
  return data;
}

export async function cancelSubscriptionRequest() {
  await axiosInstance.delete("/subscriptions/requests/me");
}

export async function updateAdminSubscription(id: string, payload: { expiresAt?: string | null; extendDays?: number; note?: string }) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}`, payload);
  return data;
}

export async function approveSubscriptionRequest(id: string, payload: { note?: string; expiresAt?: string | null } = {}) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}/approve`, payload);
  return data;
}

export async function rejectSubscriptionRequest(id: string, payload: { note?: string } = {}) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}/reject`, payload);
  return data;
}

export type AdminSubscriptionStatusFilter = "" | "current" | "expiring" | "scheduled" | "pending" | "active" | "expired" | "canceled" | "rejected" | "superseded";

export async function fetchAdminSubscriptionsFiltered(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminSubscriptionStatusFilter;
  planId?: string;
}) {
  const { data } = await axiosInstance.get<{
    items: UserSubscription[];
    summary: { paidActive: number; pending: number; expiringSoon: number; expiredThisMonth: number };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/admin/subscriptions", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status || undefined,
      planId: params.planId || undefined,
    },
  });
  return data;
}
