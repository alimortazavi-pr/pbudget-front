import { getTranslator } from "@/i18n";
import { axiosInstance } from "@/common/axiosInstance";
import { SERVER_BASE_API_URL } from "@/common/constants";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import axios from "axios";

const t = getTranslator();

export async function fetchLandingContent() {
  const { data } = await axiosInstance.get<ILandingContent>("/site/landing");
  return data;
}

/** ISR — server-side fetch with revalidation */
export async function fetchLandingContentServer(): Promise<ILandingContent> {
  try {
    const res = await fetch(`${SERVER_BASE_API_URL}/site/landing`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Landing content request failed with ${res.status}`);
    }

    return (await res.json()) as ILandingContent;
  } catch {
    const { DEFAULT_LANDING_CONTENT } = await import(
      "@/components/pages/landing/landing-data"
    );
    return DEFAULT_LANDING_CONTENT;
  }
}

export async function submitSiteContact(payload: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}) {
  try {
    const { data } = await axiosInstance.post<{ message: string }>(
      "/site/contact",
      payload,
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      const message =
        (err.response.data as { message?: string })?.message ??
        t("auto.ke6accd0253");
      throw new Error(message);
    }
    throw err;
  }
}
