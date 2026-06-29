import type { Metadata } from "next";

import { fetchLandingContentServer } from "@/common/api/site";
import { PricingPage } from "@/components/pages/landing/PricingPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchLandingContentServer();
  return {
    title: `قیمت‌ها — ${content.seo.title}`,
    description: content.pricing.description,
  };
}

export default async function Page() {
  const content = await fetchLandingContentServer();
  return <PricingPage initialContent={content} />;
}
