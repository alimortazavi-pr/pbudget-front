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
}

export interface UserSubscription {
  _id: string;
  status: "active" | "expired" | "canceled" | "pending";
  startsAt: string;
  expiresAt?: string | null;
  note?: string;
  user?: { _id: string; firstName: string; lastName: string; mobile: string };
  plan?: SubscriptionPlan;
  planSnapshot?: { slug: string; name: string; price: number; priceUnit: string; features: Record<string, unknown> };
}

export interface MySubscriptionResponse {
  subscription: UserSubscription | null;
  entitlements: Record<string, { enabled: boolean; limit?: number | null; label: string }>;
}
