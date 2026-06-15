const PROD_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.pdesk.ir/v1";

const DEV_API_URL =
  process.env.NEXT_PUBLIC_DEV_API_URL ?? "http://localhost:7701/v1";

const isDevelopment = process.env.NODE_ENV === "development";

/** Client + shared default — در `next dev` همیشه لوکال */
export const BASE_API_URL = isDevelopment ? DEV_API_URL : PROD_API_URL;

/** Server-side fetch در Next — در dev همان لوکال */
export const SERVER_BASE_API_URL = isDevelopment
  ? (process.env.INTERNAL_DEV_API_URL ?? DEV_API_URL)
  : (process.env.INTERNAL_API_URL ?? PROD_API_URL);

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7711";
