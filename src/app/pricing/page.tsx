import type { Metadata } from "next";

import { fetchLandingContentServer } from "@/common/api/site";
import { createTranslator } from "@/i18n";
import { PricingPage } from "@/components/pages/landing/PricingPage";
import { APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  createPublicPageMetadata,
  serializeJsonLd,
  SITE_URL,
} from "@/common/seo";

export const revalidate = 60;

const t = createTranslator("fa", true);

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchLandingContentServer();
  return createPublicPageMetadata({
    title: `${t("landing.nav.pricing")} — ${content.seo.title}`,
    description: content.pricing.description,
    path: "/pricing",
    keywords: ["قیمت نرم افزار مدیریت مالی", "برنامه مالی رایگان"],
  });
}

export default async function Page() {
  const content = await fetchLandingContentServer();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl("/pricing")}#webpage`,
    url: absoluteUrl("/pricing"),
    name: `${content.pricing.title} | ${APP_NAME_FA}`,
    description: content.pricing.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: content.pricing.plans.map((plan, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Offer",
          name: plan.name,
          description: plan.description,
          url: absoluteUrl("/pricing"),
          price: plan.price === "رایگان" ? 0 : undefined,
          priceCurrency: plan.price === "رایگان" ? "IRR" : undefined,
          category: "Software subscription",
        },
      })),
    },
    inLanguage: "fa-IR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PricingPage initialContent={content} />
    </>
  );
}
