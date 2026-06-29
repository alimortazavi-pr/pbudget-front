import { axiosInstance } from "@/common/axiosInstance";
import { BUSINESS_SITE_URL, PERSONAL_SITE_URL } from "@/common/constants/products";
import { storage } from "@/common/utils/storage";

export async function createSsoCode() {
  const { data } = await axiosInstance.post<{
    code: string;
    expiresInSeconds: number;
  }>("/auth/sso/create");
  return data;
}

export async function exchangeSsoCode(code: string) {
  const { data } = await axiosInstance.post<{
    user: unknown;
    token: string;
  }>("/auth/sso/exchange", { code });
  return data;
}

export async function navigateWithSso(targetSiteUrl: string, returnPath = "/") {
  const token = storage.getToken();
  if (!token) {
    window.location.href = `${targetSiteUrl}${returnPath}`;
    return;
  }

  try {
    const { code } = await createSsoCode();
    const url = new URL("/sso", targetSiteUrl);
    url.searchParams.set("code", code);
    url.searchParams.set("return", returnPath);
    window.location.href = url.toString();
  } catch {
    window.location.href = `${targetSiteUrl}${returnPath}`;
  }
}

export const CROSS_PRODUCT = {
  personal: PERSONAL_SITE_URL,
  business: BUSINESS_SITE_URL,
} as const;
