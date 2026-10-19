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

export interface BaleCheckout {
  id: string;
  link: string;
  amountRial: number;
  expiresAt: string;
  /** Amount charged in the plan's own unit (after any discount). */
  amountPlanUnit?: number;
  originalPrice?: number;
  discountAmount?: number;
  priceUnit?: string;
  discountCode?: string | null;
}

export type BalePaymentState = "pending" | "paid" | "expired";

/** Starts the one-time 7-day trial (every feature except AI). */
export async function startTrial() {
  const { data } = await axiosInstance.post<UserSubscription>("/subscriptions/trial");
  return data;
}

export async function fetchBaleAvailability() {
  const { data } = await axiosInstance.get<{ enabled: boolean }>("/subscriptions/bale/status");
  return data.enabled;
}

/** Starts a Bale wallet payment; the user then finishes it inside the Bale bot. */
export async function createBaleCheckout(planId: string, discountCode?: string) {
  const { data } = await axiosInstance.post<BaleCheckout>("/subscriptions/bale/checkout", { planId, discountCode: discountCode || undefined });
  return data;
}

export async function fetchBalePaymentStatus(id: string) {
  const { data } = await axiosInstance.get<{ id: string; status: BalePaymentState }>(`/subscriptions/bale/payments/${id}`);
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

export async function requestSubscription(planId: string, note?: string, discountCode?: string) {
  const { data } = await axiosInstance.post<UserSubscription>("/subscriptions/requests", { planId, note, discountCode: discountCode || undefined });
  return data;
}

export async function cancelSubscriptionRequest() {
  await axiosInstance.delete("/subscriptions/requests/me");
}

export async function updateAdminSubscription(id: string, payload: { expiresAt?: string | null; extendDays?: number; note?: string }) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}`, payload);
  return data;
}

export async function approveSubscriptionRequest(id: string, payload: { note?: string; expiresAt?: string | null; dropDiscount?: boolean } = {}) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}/approve`, payload);
  return data;
}

export async function rejectSubscriptionRequest(id: string, payload: { note?: string } = {}) {
  const { data } = await axiosInstance.patch<UserSubscription>(`/admin/subscriptions/${id}/reject`, payload);
  return data;
}

export type AdminSubscriptionStatusFilter = "" | "current" | "expiring" | "scheduled" | "pending" | "active" | "expired" | "canceled" | "rejected" | "superseded";

export type AdminSubscriptionSource = "" | "manual" | "bazaar" | "bale" | "trial";

export interface AdminSubscriptionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminSubscriptionStatusFilter;
  planId?: string;
  source?: AdminSubscriptionSource;
  /** Hide the automatic free plan and trials. */
  paid?: boolean;
  /** Only purchases made with a discount code. */
  discounted?: boolean;
  sort?: "" | "createdAt" | "expiresAt" | "amount";
}

function listQuery(params: AdminSubscriptionListParams) {
  return {
    search: params.search || undefined,
    status: params.status || undefined,
    planId: params.planId || undefined,
    source: params.source || undefined,
    paid: params.paid ? "1" : undefined,
    discounted: params.discounted ? "1" : undefined,
    sort: params.sort || undefined,
  };
}

export async function fetchAdminSubscriptionsFiltered(params: AdminSubscriptionListParams) {
  const { data } = await axiosInstance.get<{
    items: UserSubscription[];
    summary: { paidActive: number; pending: number; expiringSoon: number; expiredThisMonth: number };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/admin/subscriptions", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...listQuery(params),
    },
  });
  return data;
}

/** Downloads the subscriber list (same filters as the table) as CSV. */
export async function downloadAdminSubscriptionsCsv(params: AdminSubscriptionListParams) {
  const query = Object.fromEntries(Object.entries(listQuery(params)).filter(([, value]) => value !== undefined)) as Record<string, string>;
  const { downloadAdminFile } = await import("@/common/api/admin");
  await downloadAdminFile("/admin/subscriptions/export", `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`, query);
}

export async function addAdminSubscriptionNote(id: string, payload: { kind: "note" | "refund"; text?: string; amountToman?: number; revoke?: boolean }) {
  const { data } = await axiosInstance.post<UserSubscription>(`/admin/subscriptions/${id}/notes`, payload);
  return data;
}

// ---- Dashboard ---------------------------------------------------------------

export interface SubscriptionOverviewPoint {
  /** Tehran calendar day, YYYY-MM-DD. */
  date: string;
  /** Revenue in tomans. */
  revenue: number;
  payments: number;
  newPaid: number;
  churned: number;
  trials: number;
}

/** All money values are in tomans. */
export interface SubscriptionOverview {
  generatedAt: string;
  range: { days: number; from: string; to: string };
  kpis: {
    mrr: number;
    revenue30d: number;
    revenuePrev30d: number;
    payments30d: number;
    paymentsPrev30d: number;
    averageOrder30d: number;
    revenueInRange: number;
    activePaid: number;
    activeTrials: number;
    pending: number;
    expiringSoon: number;
    churned30d: number;
    churnRate30d: number;
    trialConversion: { trials: number; converted: number; rate: number };
    refunds30d: number;
    discount30d: { redemptions: number; revenueToman: number; discountToman: number };
  };
  series: SubscriptionOverviewPoint[];
  planMix: { planId: string; name: string; count: number; mrr: number }[];
  sourceMix: { source: string; count: number }[];
  revenueBySource30d: { source: string; revenue: number; payments: number }[];
}

export async function fetchAdminSubscriptionOverview(days: number) {
  const { data } = await axiosInstance.get<SubscriptionOverview>("/admin/subscriptions/overview", { params: { days } });
  return data;
}

// ---- Discount codes ------------------------------------------------------------

export type DiscountType = "percent" | "fixed";
export type DiscountState = "live" | "inactive" | "expired" | "scheduled" | "exhausted";

export interface DiscountCodeStats {
  redemptions: number;
  reserved: number;
  revenueToman: number;
  discountToman: number;
  lastRedeemedAt: string | null;
}

export interface AdminDiscountCode {
  _id: string;
  code: string;
  title: string;
  campaign: string;
  description: string;
  type: DiscountType;
  /** Percent, or tomans for a fixed discount. */
  value: number;
  /** Tomans; percent codes only. */
  maxDiscount: number | null;
  planIds: { _id: string; name: string; slug: string }[];
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  firstPurchaseOnly: boolean;
  active: boolean;
  usedCount: number;
  createdBy?: { firstName?: string; lastName?: string } | null;
  createdAt: string;
  stats: DiscountCodeStats;
  state: DiscountState;
}

export interface DiscountCampaign {
  name: string;
  codes: number;
  activeCodes: number;
  redemptions: number;
  revenueToman: number;
  discountToman: number;
  startsAt: string | null;
  endsAt: string | null;
  lastRedeemedAt: string | null;
}

export interface AdminDiscountList {
  items: AdminDiscountCode[];
  campaigns: DiscountCampaign[];
  totals: { codes: number; liveCodes: number; redemptions: number; revenueToman: number; discountToman: number };
  daily: { _id: string; count: number; revenueToman: number; discountToman: number }[];
}

export interface DiscountCodePayload {
  code: string;
  title: string;
  campaign?: string;
  description?: string;
  type: DiscountType;
  value: number;
  maxDiscount?: number | null;
  planIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  firstPurchaseOnly?: boolean;
  active?: boolean;
}

export async function fetchAdminDiscounts(params: { search?: string; status?: string; campaign?: string } = {}) {
  const { data } = await axiosInstance.get<AdminDiscountList>("/admin/subscriptions/discounts", {
    params: { search: params.search || undefined, status: params.status || undefined, campaign: params.campaign || undefined },
  });
  return data;
}

export async function createAdminDiscount(payload: DiscountCodePayload) {
  const { data } = await axiosInstance.post<AdminDiscountCode>("/admin/subscriptions/discounts", payload);
  return data;
}

export async function updateAdminDiscount(id: string, payload: Partial<DiscountCodePayload>) {
  const { data } = await axiosInstance.patch<AdminDiscountCode>(`/admin/subscriptions/discounts/${id}`, payload);
  return data;
}

export async function setAdminDiscountActive(id: string, active: boolean) {
  const { data } = await axiosInstance.patch<AdminDiscountCode>(`/admin/subscriptions/discounts/${id}/${active ? "enable" : "disable"}`);
  return data;
}

export async function deleteAdminDiscount(id: string) {
  await axiosInstance.delete(`/admin/subscriptions/discounts/${id}`);
}

export interface DiscountRedemptionRow {
  _id: string;
  code: string;
  flow: "bale" | "manual";
  status: "reserved" | "redeemed";
  priceUnit: string;
  amountBefore: number;
  discountAmount: number;
  amountAfter: number;
  redeemedAt?: string | null;
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string; mobile?: string } | null;
  plan?: { name?: string } | null;
}

export async function fetchAdminDiscountRedemptions(id: string, page = 1) {
  const { data } = await axiosInstance.get<{
    stats: DiscountCodeStats;
    items: DiscountRedemptionRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/admin/subscriptions/discounts/${id}/redemptions`, { params: { page, limit: 10 } });
  return data;
}

export type DiscountValidation =
  | { valid: true; code: string; title: string; type: DiscountType; value: number; original: number; discount: number; final: number; priceUnit: string }
  | { valid: false; reason: string; original: number; discount: number; final: number; priceUnit: string };

/** Prices a plan with a code on the server (the client never computes the amount). */
export async function validateDiscountCode(planId: string, code: string, flow: "bale" | "manual" = "manual") {
  const { data } = await axiosInstance.post<DiscountValidation>("/subscriptions/discounts/validate", { planId, code, flow });
  return data;
}

export interface AdminBalePayment {
  _id: string;
  status: "pending" | "paid";
  amountRial: number;
  amountPlanUnit: number;
  expiresAt: string;
  paidAt?: string | null;
  createdAt: string;
  chargeId?: string | null;
  providerChargeId?: string | null;
  subscription?: string | null;
  user?: { firstName?: string; lastName?: string; mobile?: string } | null;
  plan?: { name?: string } | null;
}

export async function fetchAdminBalePayments(params: { status?: string; page?: number }) {
  const { data } = await axiosInstance.get<{
    items: AdminBalePayment[];
    summary: { paidCount: number; paidRial: number };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/admin/subscriptions/bale-payments", { params: { status: params.status || undefined, page: params.page ?? 1, limit: 20 } });
  return data;
}

export interface FeatureDefinition {
  key: string;
  group: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  /** A plan silent about this feature follows that other feature instead of `defaultEnabled`. */
  inheritsFrom?: string;
  limitLabel?: string;
}

/** What a plan that does not mention `definition` effectively gets (mirrors the server). */
export function featureDefaultFor(
  definition: FeatureDefinition,
  configured: { key: string; enabled?: boolean }[],
  catalog: FeatureDefinition[],
): boolean {
  if (definition.inheritsFrom) {
    const parent = configured.find((feature) => feature.key === definition.inheritsFrom);
    if (parent) return parent.enabled !== false;
    const parentDefinition = catalog.find((feature) => feature.key === definition.inheritsFrom);
    if (parentDefinition) return featureDefaultFor(parentDefinition, configured, catalog);
  }
  return definition.defaultEnabled;
}

export async function fetchAdminFeatureCatalog() {
  const { data } = await axiosInstance.get<FeatureDefinition[]>("/admin/subscriptions/feature-catalog");
  return data;
}
