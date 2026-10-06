export type SubscriptionPeriod = "monthly" | "yearly" | "lifetime" | "custom";

export interface SubscriptionFeature {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  limit?: number | null;
}

export interface SubscriptionPlan {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  period: SubscriptionPeriod;
  periodDays?: number | null;
  features: SubscriptionFeature[];
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
  contactMessage: string;
  /** Cafe Bazaar in-app product that sells one period of this plan. */
  bazaarProductId?: string | null;
  activeSubscribers?: number;
  isFallback?: boolean;
}

export type SubscriptionStatus = "active" | "expired" | "canceled" | "pending" | "rejected" | "superseded";

export interface UserSubscription {
  _id: string;
  status: SubscriptionStatus;
  source?: "manual" | "bazaar";
  amountPaid?: number | null;
  startsAt: string;
  expiresAt?: string | null;
  note?: string;
  user?: { _id: string; firstName: string; lastName: string; mobile: string; deleted?: boolean };
  plan?: SubscriptionPlan;
  assignedBy?: { _id: string; firstName: string; lastName: string } | string | null;
  canceledBy?: { _id: string; firstName: string; lastName: string } | string | null;
  canceledAt?: string | null;
  requestedByUser?: boolean;
  requestNote?: string;
  createdAt?: string;
  planSnapshot?: { slug: string; name: string; price: number; priceUnit: string; features: Record<string, unknown> };
}

export interface MySubscriptionResponse {
  subscription: UserSubscription | null;
  entitlements: Record<string, { enabled: boolean; limit?: number | null; label: string }>;
  /** Days until expiry; null for plans that never expire. */
  daysRemaining?: number | null;
  /** A plan the user asked for that waits for an administrator. */
  pendingRequest?: UserSubscription | null;
  /** A plan scheduled to start in the future. */
  upcoming?: UserSubscription | null;
}
