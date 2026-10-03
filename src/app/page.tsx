import type { Metadata } from "next";

import { fetchLandingContentServer } from "@/common/api/site";
import { LandingJsonLd } from "@/components/pages/landing/LandingJsonLd";
import { LandingPage } from "@/components/pages/landing/LandingPage";
import { createPublicPageMetadata, SITE_URL } from "@/common/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchLandingContentServer();
  return createPublicPageMetadata({
    title: content.seo.title,
    description: content.seo.description,
    path: "/",
    image: content.seo.ogImageUrl,
    imageAlt: `${content.hero.title} — ${content.hero.tagline}`,
    keywords: content.features.flatMap((feature) => [
      feature.title,
      ...feature.tags,
    ]),
  });
}

export default async function Page() {
  const content = await fetchLandingContentServer();

  return (
    <>
      <LandingJsonLd content={content} siteUrl={SITE_URL} />
      <LandingPage initialContent={content} />
    </>
  );
}
