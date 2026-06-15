import axios from "axios";

const API_ERROR_TRANSLATIONS: Record<string, string> = {
  "Please enter the 'Type (0 or 1)' correctly": "نوع تراکنش (دریافتی/پرداختی) نامعتبر است",
  "Please enter the 'type (0 or 1)' correctly": "نوع تراکنش (دریافتی/پرداختی) نامعتبر است",
};

function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  return API_ERROR_TRANSLATIONS[trimmed] ?? trimmed;
}

function normalizeMessagePayload(message: unknown): string | null {
  if (typeof message === "string" && message.trim()) {
    return translateApiMessage(message);
  }

  if (Array.isArray(message)) {
    const parts = message
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map(translateApiMessage);
    if (parts.length > 0) return parts.join(" · ");
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback = "خطا"): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown } | undefined;
    const fromPayload = normalizeMessagePayload(payload?.message);
    if (fromPayload) return fromPayload;
  }

  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
    return error.message;
  }

  return fallback;
}
