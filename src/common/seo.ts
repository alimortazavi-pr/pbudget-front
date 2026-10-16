import type { Metadata } from "next";

import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import {
  APP_DESCRIPTION_FA,
  APP_NAME_EN,
  APP_NAME_FA,
  CONTACT_EMAIL,
  LOGO_OG_IMAGE_SRC,
} from "@/common/constants/brand";

const PRODUCTION_SITE_URL = "https://pdesk.ir";

export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_SITE_URL,
).origin;

export const DEFAULT_KEYWORDS = [
  "اپلیکیشن مدیریت مالی شخصی",
  "مدیریت مالی شخصی",
  "حسابداری شخصی",
  "بودجه‌بندی",
  "مدیریت هزینه",
  "دخل و خرج",
  "ثبت درآمد و هزینه",
  "مدیریت اقساط",
  "مدیریت چک",
  "تقویم شمسی",
  "میز پردیس",
  "Paradise Desk",
];

/** Date of the last meaningful edit to the static public pages (sitemap lastModified). */
export const SITE_LAST_UPDATED = "2026-10-16";

/**
 * Signed-in application, admin and API paths. They are disallowed in
 * robots.txt and inherit the root layout's noindex metadata. Keep in sync
 * with src/app when adding a private segment.
 */
export const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/ai",
  "/api",
  "/app",
  "/analysis",
  "/bank-import",
  "/boxes",
  "/budgets",
  "/checks",
  "/commitments",
  "/create-budget",
  "/debts",
  "/exports",
  "/installments",
  "/invites",
  "/landing-preview",
  "/notes",
  "/partner-invite",
  "/payment-cards",
  "/planning",
  "/plans",
  "/profile",
  "/projects",
  "/settings",
  "/support",
  "/tasks",
  "/ventures",
  "/workspace",
  "/~offline",
] as const;

/** Search and AI-answer crawlers that are explicitly welcome on public pages. */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "CCBot",
  "Bingbot",
] as const;

type PublicPageMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = LOGO_OG_IMAGE_SRC,
  imageAlt = `${APP_NAME_FA} | ${APP_NAME_EN}`,
  type = "website",
}: PublicPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    // Public pages provide complete CMS-aware titles; do not append the root
    // template and accidentally repeat the brand name in search results.
    title: { absolute: title },
    description,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: {
      canonical,
      languages: { "fa-IR": canonical, "x-default": canonical },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      type,
      locale: "fa_IR",
      url: canonical,
      siteName: APP_NAME_FA,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const ORGANIZATION_JSON_LD = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: APP_NAME_FA,
  alternateName: APP_NAME_EN,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/assets/icons/icon-512x512.png"),
    width: 512,
    height: 512,
  },
  email: CONTACT_EMAIL,
  description: APP_DESCRIPTION_FA,
  sameAs: ["https://t.me/paradisebudget_bot"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT_EMAIL,
    availableLanguage: ["fa"],
  },
};

/** The site has no internal search page, so no SearchAction is declared. */
export const WEBSITE_JSON_LD = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: APP_NAME_FA,
  alternateName: APP_NAME_EN,
  url: SITE_URL,
  description: APP_DESCRIPTION_FA,
  inLanguage: "fa-IR",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export type JsonLdOffer = {
  "@type": "Offer";
  name: string;
  price: number;
  priceCurrency: "IRR";
  url: string;
  description?: string;
  category?: string;
};

/** A free entry offer; the real tiers come from the subscription API when reachable. */
export const FREE_OFFER: JsonLdOffer = {
  "@type": "Offer",
  name: "رایگان",
  price: 0,
  priceCurrency: "IRR",
  url: absoluteUrl("/pricing"),
  category: "free",
};

/**
 * Converts live subscription plans into schema.org offers (prices in IRR).
 * Falls back to the free offer when no plan data is available.
 */
export function plansToOffers(plans: SubscriptionPlan[] | null | undefined): JsonLdOffer[] {
  if (!plans?.length) return [FREE_OFFER];
  return plans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    description: plan.description || undefined,
    price: /ریال/.test(plan.priceUnit ?? "") ? Math.round(plan.price) : Math.round(plan.price * 10),
    priceCurrency: "IRR",
    url: absoluteUrl("/pricing"),
    category: plan.price ? plan.period : "free",
  }));
}

const SHARED_APP_FIELDS = {
  name: APP_NAME_FA,
  alternateName: APP_NAME_EN,
  applicationCategory: "FinanceApplication",
  applicationSubCategory: "Personal finance",
  inLanguage: "fa-IR",
  image: absoluteUrl(LOGO_OG_IMAGE_SRC),
  publisher: { "@id": `${SITE_URL}/#organization` },
  author: { "@id": `${SITE_URL}/#organization` },
};

/** Web app + installable PWA. Never add aggregateRating/review without real data. */
export function webApplicationJsonLd(offers: JsonLdOffer[] = [FREE_OFFER], featureList: string[] = []) {
  return {
    "@type": ["SoftwareApplication", "WebApplication"],
    "@id": `${SITE_URL}/#software`,
    ...SHARED_APP_FIELDS,
    url: SITE_URL,
    description: APP_DESCRIPTION_FA,
    operatingSystem: "Web (PWA), Android",
    browserRequirements: "Requires JavaScript and a modern web browser",
    ...(featureList.length ? { featureList } : {}),
    offers,
  };
}

/** The APK link is served by the API at runtime, so the download page is the install URL. */
export function androidAppJsonLd(offers: JsonLdOffer[] = [FREE_OFFER]) {
  return {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}/#android-app`,
    ...SHARED_APP_FIELDS,
    url: absoluteUrl("/download"),
    description:
      "اپ اندروید میز پردیس برای مدیریت مالی شخصی: ثبت درآمد و هزینه، بودجه‌بندی، اقساط، چک و صندوق‌های پس‌انداز با تقویم شمسی.",
    operatingSystem: "Android 7.0 or later",
    installUrl: absoluteUrl("/download"),
    offers,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: `/${string}` | "/" }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(items: { q: string; a: string }[], id?: string) {
  return {
    "@type": "FAQPage",
    ...(id ? { "@id": id } : {}),
    inLanguage: "fa-IR",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Renders one `<script type="application/ld+json">` payload with a shared @context. */
export function jsonLdGraph(nodes: unknown[]) {
  return serializeJsonLd({ "@context": "https://schema.org", "@graph": nodes });
}
