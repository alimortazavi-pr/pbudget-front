import type { UserSubscription } from "@/common/interfaces/subscription.interface";
import type { Tone } from "./ui/AdminUi";

export const SUBSCRIPTION_STATUS_LABEL: Record<UserSubscription["status"], string> = {
  active: "فعال",
  pending: "در انتظار تأیید",
  expired: "منقضی",
  canceled: "لغوشده",
};

export const SUBSCRIPTION_STATUS_TONE: Record<UserSubscription["status"], Tone> = {
  active: "success",
  pending: "warning",
  expired: "neutral",
  canceled: "danger",
};

export const SUBSCRIPTION_PERIOD_LABEL: Record<string, string> = {
  monthly: "ماهانه",
  yearly: "سالانه",
  lifetime: "دائمی",
  custom: "سفارشی",
};
