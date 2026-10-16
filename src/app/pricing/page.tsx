import type { Metadata } from "next";

import { fetchLandingContentServer, fetchPublicPlansServer } from "@/common/api/site";
import { PricingPage } from "@/components/pages/landing/PricingPage";
import { APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  createPublicPageMetadata,
  jsonLdGraph,
  plansToOffers,
  SITE_URL,
} from "@/common/seo";

export const revalidate = 60;

const TITLE = `قیمت و پلن‌های ${APP_NAME_FA}؛ اپلیکیشن مدیریت مالی شخصی با نسخه رایگان`;
const DESCRIPTION =
  "پلن رایگان میز پردیس برای ثبت درآمد و هزینه، صندوق پس‌انداز، اقساط، چک و طلب و بدهی؛ دوره آزمایشی ۷ روزه و پلن‌های پولی برای ورود صورتحساب بانکی، تحلیل مالی، پروژه و دستیار هوشمند.";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/pricing",
    keywords: ["قیمت اپلیکیشن مدیریت مالی", "برنامه حسابداری شخصی رایگان", "اشتراک میز پردیس", "پلن کسب‌وکار"],
  });
}

export default async function Page() {
  const [content, plans] = await Promise.all([fetchLandingContentServer(), fetchPublicPlansServer()]);
  const url = absoluteUrl("/pricing");
  const offers = plansToOffers(plans);
  const nodes = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#software` },
      inLanguage: "fa-IR",
      mainEntity: {
        "@type": "Product",
        "@id": `${url}#product`,
        name: APP_NAME_FA,
        description: DESCRIPTION,
        brand: { "@id": `${SITE_URL}/#organization` },
        image: absoluteUrl("/assets/og-landing.png"),
        offers,
      },
    },
    breadcrumbJsonLd([
      { name: APP_NAME_FA, path: "/" },
      { name: "قیمت‌ها", path: "/pricing" },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }}
      />
      <PricingPage initialContent={content} />
    </>
  );
}
