import { axiosInstance } from "@/common/axiosInstance";
import type { IProfile } from "@/common/interfaces/profile.interface";
import { normalizeProfile } from "@/common/utils/profile";

export async function fetchProfile() {
  const { data } = await axiosInstance.get<{ user: IProfile }>("/users/profile");
  return normalizeProfile(data.user as unknown as Record<string, unknown>);
}

export async function updateProfile(payload: {
  firstName: string;
  lastName: string;
}) {
  const { data } = await axiosInstance.put("/users/profile", payload);
  return normalizeProfile(data.user as Record<string, unknown>);
}

export async function changeMobile(payload: { mobile: string; code: string }) {
  const { data } = await axiosInstance.put("/users/profile/change-mobile", payload);
  return {
    token: data.token as string,
    user: normalizeProfile(data.user as Record<string, unknown>),
  };
}

export async function verifyMobile(code: string) {
  const { data } = await axiosInstance.put("/users/profile/verify-mobile", {
    code,
  });
  return normalizeProfile(data.user as Record<string, unknown>);
}

export async function setPassword(password: string) {
  await axiosInstance.put("/users/profile/set-password", { password });
}

export async function changeUserBudget(price: number) {
  const { data } = await axiosInstance.put("/users/profile/change-budget", {
    price,
  });
  return normalizeProfile(data.user as Record<string, unknown>);
}

export type TelegramStatus = {
  linked: boolean;
  botUsername: string | null;
};

export async function fetchTelegramStatus() {
  const { data } = await axiosInstance.get<TelegramStatus>(
    "/users/profile/telegram",
  );
  return data;
}

export async function createTelegramLink() {
  const { data } = await axiosInstance.post<{
    token: string;
    expiresAt: string;
    botUsername: string | null;
  }>("/users/profile/telegram-link");
  return data;
}

export async function unlinkTelegram() {
  const { data } = await axiosInstance.delete<{ message: string }>(
    "/users/profile/telegram",
  );
  return data;
}
