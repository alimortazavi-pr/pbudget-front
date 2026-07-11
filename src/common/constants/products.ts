/** Cross-links between Paradise Desk product family sites */

export const PERSONAL_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pdesk.ir";

export const BUSINESS_SITE_URL =
  process.env.NEXT_PUBLIC_BUSINESS_SITE_URL ?? "https://business.pdesk.ir";

export const PRODUCT_FAMILY = {
  personal: {
    nameKey: "brand.appName",
    taglineKey: "brand.tagline",
    url: PERSONAL_SITE_URL,
  },
  business: {
    nameKey: "common.businessProductName",
    taglineKey: "common.businessProductTagline",
    url: BUSINESS_SITE_URL,
  },
} as const;

/** Business desk green theme — cross-links in pbudget */
export const BUSINESS_BRAND = {
  primary: "#2dd4bf",
  primaryDeep: "#0d9488",
  emerald: "#10b981",
  emeraldDeep: "#047857",
  surface: "color-mix(in oklch, #2dd4bf 10%, transparent)",
  border: "color-mix(in oklch, #2dd4bf 28%, transparent)",
} as const;
