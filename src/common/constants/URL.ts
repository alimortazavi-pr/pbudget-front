export const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.pbudget.ir/v1";

export const SERVER_BASE_API_URL =
  process.env.INTERNAL_API_URL ?? BASE_API_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7711";
