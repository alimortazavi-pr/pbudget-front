import { axiosInstance } from "@/common/axiosInstance";
import type { IProfile } from "@/common/interfaces/profile.interface";

export async function fetchProfile() {
  const { data } = await axiosInstance.get<{ user: IProfile }>("/users/profile");
  return data.user;
}

export async function updateProfile(payload: {
  firstName: string;
  lastName: string;
}) {
  const { data } = await axiosInstance.put("/users/profile", payload);
  return data.user as IProfile;
}

export async function changeMobile(payload: { mobile: string; code: string }) {
  const { data } = await axiosInstance.put("/users/profile/change-mobile", payload);
  return data as { token: string; user: IProfile };
}

export async function verifyMobile(code: string) {
  const { data } = await axiosInstance.put("/users/profile/verify-mobile", {
    code,
  });
  return data.user as IProfile;
}

export async function setPassword(password: string) {
  await axiosInstance.put("/users/profile/set-password", { password });
}

export async function changeUserBudget(price: number) {
  const { data } = await axiosInstance.put("/users/profile/change-budget", {
    price,
  });
  return data.user as IProfile;
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
