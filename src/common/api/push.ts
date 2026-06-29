import { axiosInstance } from "@/common/axiosInstance";

export type PushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

export type PushSubscriptionRow = {
  endpoint: string;
  attendanceReminders: boolean;
  businessId?: string | null;
};

export async function fetchPushConfig() {
  const { data } = await axiosInstance.get<PushConfig>("/push/config");
  return data;
}

export async function fetchPushSubscriptions() {
  const { data } = await axiosInstance.get<PushSubscriptionRow[]>(
    "/push/subscriptions",
  );
  return data;
}

export async function subscribePush(body: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  businessId?: string;
  attendanceReminders?: boolean;
}) {
  const { data } = await axiosInstance.post("/push/subscribe", body);
  return data;
}

export async function unsubscribePush(body: { endpoint: string }) {
  const { data } = await axiosInstance.delete("/push/subscribe", { data: body });
  return data;
}
