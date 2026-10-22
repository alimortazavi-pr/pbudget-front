import { axiosInstance } from "@/common/axiosInstance";

export type AnnouncementAudience = "all" | "no_plan" | "paid";
export type AnnouncementPlatform = "web" | "android";

/** What a signed-in user is shown. */
export interface ActiveAnnouncement {
  id: string;
  title: string;
  body: string;
  discountCode: string | null;
  ctaLabel: string | null;
  endsAt: string | null;
}

export interface AdminAnnouncement {
  _id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  platforms: AnnouncementPlatform[];
  discountCode: string;
  ctaLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  viewCount: number;
  ctaCount: number;
  createdAt: string;
  status: "live" | "scheduled" | "ended" | "disabled";
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  platforms: AnnouncementPlatform[];
  discountCode: string;
  ctaLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export async function fetchActiveAnnouncements() {
  const { data } = await axiosInstance.get<ActiveAnnouncement[]>("/announcements/active", { params: { platform: "web" } });
  return data;
}

export async function dismissAnnouncement(id: string, clicked = false) {
  await axiosInstance.post(`/announcements/${id}/dismiss`, { clicked });
}

export async function fetchAdminAnnouncements() {
  const { data } = await axiosInstance.get<AdminAnnouncement[]>("/admin/announcements");
  return data;
}

export async function createAdminAnnouncement(payload: AnnouncementPayload) {
  const { data } = await axiosInstance.post<AdminAnnouncement>("/admin/announcements", payload);
  return data;
}

export async function updateAdminAnnouncement(id: string, payload: Partial<AnnouncementPayload>) {
  const { data } = await axiosInstance.patch<AdminAnnouncement>(`/admin/announcements/${id}`, payload);
  return data;
}

export async function deleteAdminAnnouncement(id: string) {
  await axiosInstance.delete(`/admin/announcements/${id}`);
}
