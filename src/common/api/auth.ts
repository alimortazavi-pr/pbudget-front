import { axiosInstance } from "@/common/axiosInstance";
import type {
  ICheckMobileExistResult,
  ISignInForm,
  ISignInPasswordForm,
  ISignUpForm,
} from "@/common/interfaces";
import type { IProfile } from "@/common/interfaces/profile.interface";
import { normalizeProfile } from "@/common/utils/profile";

export async function checkAuth(token: string) {
  const { data } = await axiosInstance.get<{ user: IProfile }>("/auth/check", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { user: normalizeProfile(data.user as unknown as Record<string, unknown>) };
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
  return {
    token: data.token,
    user: normalizeProfile(data.user as unknown as Record<string, unknown>),
  };
}

export async function signIn(form: ISignInForm) {
  const { data } = await axiosInstance.post<{
    token: string;
    user: IProfile;
  }>("/auth/login", form);
  return {
    token: data.token,
    user: normalizeProfile(data.user as unknown as Record<string, unknown>),
  };
}

export async function signInWithPassword(form: ISignInPasswordForm) {
  const { data } = await axiosInstance.post<{
    token: string;
    user: IProfile;
  }>("/auth/login-password", form);
  return {
    token: data.token,
    user: normalizeProfile(data.user as unknown as Record<string, unknown>),
  };
}

export type PostLoginContextResponse = {
  suggestedPath: string;
  choices: {
    id: string;
    label: string;
    description: string;
    path: string;
    kind: string;
  }[];
  pendingInvitesCount: number;
  businessCount: number;
};

export async function fetchPostLoginContext() {
  const { data } = await axiosInstance.get<PostLoginContextResponse>(
    "/auth/post-login-context",
  );
  return data;
}

export async function logWorkspaceSelection(input: {
  path: string;
  kind: string;
  label?: string;
}) {
  await axiosInstance.post("/auth/workspace-selected", input);
}
