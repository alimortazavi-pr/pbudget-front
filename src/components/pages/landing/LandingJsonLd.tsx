import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { APP_NAME_EN, APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  ORGANIZATION_JSON_LD,
  serializeJsonLd,
} from "@/common/seo";

type Props = {
  content: ILandingContent;
  siteUrl: string;
};

export function LandingJsonLd({ content, siteUrl }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: APP_NAME_FA,
        alternateName: APP_NAME_EN,
        url: siteUrl,
        description: content.seo.description,
        inLanguage: "fa-IR",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      ORGANIZATION_JSON_LD,
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: content.seo.title,
        description: content.seo.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#software` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl(content.seo.ogImageUrl),
          width: 1200,
          height: 630,
        },
        inLanguage: "fa-IR",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: APP_NAME_FA,
        alternateName: APP_NAME_EN,
        url: siteUrl,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Android",
        browserRequirements: "Requires JavaScript and a modern web browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "IRR",
        },
        description: content.hero.description,
        image: absoluteUrl(content.seo.ogImageUrl),
        publisher: { "@id": `${siteUrl}/#organization` },
        featureList: content.features.map((feature) => feature.title),
        inLanguage: "fa-IR",
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
