/** آدرس محصولات خانواده میز پردیس — برای لینک متقابل */

export const PERSONAL_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pdesk.ir";

export const BUSINESS_SITE_URL =
  process.env.NEXT_PUBLIC_BUSINESS_SITE_URL ?? "https://business.pdesk.ir";

export const PRODUCT_FAMILY = {
  personal: {
    name: "میز پردیس",
    tagline: "مدیریت مالی شخصی",
    url: PERSONAL_SITE_URL,
  },
  business: {
    name: "میز پردیس کسب‌وکار",
    tagline: "حضور GPS، پرسنل و مالی تیمی",
    url: BUSINESS_SITE_URL,
  },
} as const;

/** تم سبز میز کسب‌وکار — برای لینک‌های متقابل در pbudget */
export const BUSINESS_BRAND = {
  primary: "#2dd4bf",
  primaryDeep: "#0d9488",
  emerald: "#10b981",
  emeraldDeep: "#047857",
  surface: "color-mix(in oklch, #2dd4bf 10%, transparent)",
  border: "color-mix(in oklch, #2dd4bf 28%, transparent)",
} as const;
