import { axiosInstance } from "@/common/axiosInstance";
import type {
  ICheckMobileExistResult,
  ISignInForm,
  ISignInPasswordForm,
  ISignUpForm,
} from "@/common/interfaces";
import type { IProfile } from "@/common/interfaces/profile.interface";

export async function checkAuth(token: string) {
  const { data } = await axiosInstance.get<{ user: IProfile }>("/auth/check", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function checkMobileExist(mobile: string) {
  const { data } = await axiosInstance.post<ICheckMobileExistResult>(
    "/auth/check-mobile-exist",
    { mobile },
  );
  return data;
}

export async function requestCode(mobile: string) {
  await axiosInstance.post("/auth/request-code", { mobile });
}

export async function signUp(form: ISignUpForm) {
  const { data } = await axiosInstance.post<{
    token: string;
    user: IProfile;
  }>("/auth/register", form);
  return data;
}

export async function signIn(form: ISignInForm) {
  const { data } = await axiosInstance.post<{
    token: string;
    user: IProfile;
  }>("/auth/login", form);
  return data;
}

export async function signInWithPassword(form: ISignInPasswordForm) {
  const { data } = await axiosInstance.post<{
    token: string;
    user: IProfile;
  }>("/auth/login-password", form);
  return data;
}
