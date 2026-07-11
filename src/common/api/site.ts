import { getTranslator } from "@/i18n";
import { axiosInstance } from "@/common/axiosInstance";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import axios from "axios";

const t = getTranslator();

const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:7701/v1";

export async function fetchLandingContent() {
  const { data } = await axiosInstance.get<ILandingContent>("/site/landing");
  return data;
}

/** ISR — server-side fetch with revalidation */
export async function fetchLandingContentServer(): Promise<ILandingContent> {
  const res = await fetch(`${API_BASE}/site/landing`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const { DEFAULT_LANDING_CONTENT } = await import(
      "@/components/pages/landing/landing-data"
    );
    return DEFAULT_LANDING_CONTENT;
  }
  return res.json() as Promise<ILandingContent>;
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
