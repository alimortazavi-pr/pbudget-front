import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { APP_NAME_FA } from "@/common/constants/brand";

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
        name: APP_NAME_FA,
        url: siteUrl,
        description: content.seo.description,
        inLanguage: "fa-IR",
      },
      {
        "@type": "SoftwareApplication",
        name: APP_NAME_FA,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "IRR",
        },
        description: content.hero.description,
      },
      {
        "@type": "FAQPage",
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
