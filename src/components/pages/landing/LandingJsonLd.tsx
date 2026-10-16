import type { ILandingContent } from "@/common/interfaces/landing.interface";
import {
  absoluteUrl,
  androidAppJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  ORGANIZATION_JSON_LD,
  type JsonLdOffer,
  webApplicationJsonLd,
  WEBSITE_JSON_LD,
} from "@/common/seo";

type Props = {
  content: ILandingContent;
  siteUrl: string;
  offers: JsonLdOffer[];
};

/**
 * One @graph for the home page: WebSite, Organization, WebPage, the web app,
 * the Android app and the landing FAQ. Other pages reference these nodes by
 * @id instead of repeating them. No ratings or reviews are declared.
 */
export function LandingJsonLd({ content, siteUrl, offers }: Props) {
  const nodes = [
    WEBSITE_JSON_LD,
    ORGANIZATION_JSON_LD,
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: content.seo.title,
      description: content.seo.description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#software` },
      mainEntity: { "@id": `${siteUrl}/#software` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl(content.seo.ogImageUrl),
        width: 1200,
        height: 630,
      },
      inLanguage: "fa-IR",
    },
    {
      ...webApplicationJsonLd(offers, content.features.map((feature) => feature.title)),
      description: content.hero.description,
    },
    androidAppJsonLd(offers),
    ...(content.faq.length ? [faqPageJsonLd(content.faq, `${siteUrl}/#faq`)] : []),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }}
    />
  );
}
