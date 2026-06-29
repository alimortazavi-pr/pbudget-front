import type { Metadata } from "next";

import { fetchLandingContentServer } from "@/common/api/site";
import { APP_NAME_EN } from "@/common/constants/brand";
import { LandingJsonLd } from "@/components/pages/landing/LandingJsonLd";
import { LandingPage } from "@/components/pages/landing/LandingPage";

export const revalidate = 60;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7711";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchLandingContentServer();
  const ogImage = content.seo.ogImageUrl.startsWith("http")
    ? content.seo.ogImageUrl
    : `${siteUrl}${content.seo.ogImageUrl}`;

  return {
    title: content.seo.title,
    description: content.seo.description,
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      type: "website",
      locale: "fa_IR",
      url: siteUrl,
      siteName: APP_NAME_EN,
      images: [{ url: ogImage, width: 1200, height: 630, alt: content.hero.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
      images: [ogImage],
    },
  };
}

export default async function Page() {
  const content = await fetchLandingContentServer();

  return (
    <>
      <LandingJsonLd content={content} siteUrl={siteUrl} />
      <LandingPage initialContent={content} />
    </>
  );
}
