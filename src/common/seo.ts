import type { Metadata } from "next";

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
  "مدیریت مالی شخصی",
  "حسابداری شخصی",
  "بودجه بندی",
  "برنامه مدیریت مالی",
  "ثبت درآمد و هزینه",
  "کنترل مخارج",
  "مدیریت اقساط",
  "مدیریت چک",
  "تقویم شمسی",
  "مدیریت پروژه فریلنسری",
  "میز پردیس",
  "Paradise Desk",
];

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
    availableLanguage: ["fa", "en", "ar"],
  },
};
