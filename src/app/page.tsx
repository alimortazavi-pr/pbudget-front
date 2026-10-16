import type { Metadata } from "next";

import { fetchLandingContentServer, fetchPublicPlansServer } from "@/common/api/site";
import { LandingJsonLd } from "@/components/pages/landing/LandingJsonLd";
import { LandingPage } from "@/components/pages/landing/LandingPage";
import { createPublicPageMetadata, plansToOffers, SITE_URL } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";

export const revalidate = 60;

const HOME_KEYWORDS = [
  "بهترین اپلیکیشن مدیریت مالی شخصی",
  "نرم افزار حسابداری شخصی",
  "برنامه بودجه‌بندی ماهانه",
  "اپ ثبت هزینه",
  "مدیریت دخل و خرج",
  "حسابداری شخصی با تقویم شمسی",
];

/** Pillar guides shown first in the landing "guides" section and footer. */
const FEATURED_GUIDES = [
  "best-persian-personal-finance-app",
  "how-to-budget-monthly",
  "personal-finance-guide",
  "installments-cheques-app",
  "bank-statement-import",
  "savings-box-financial-goal",
];

function featuredRank(slug: string) {
  const index = FEATURED_GUIDES.indexOf(slug);
  return index === -1 ? FEATURED_GUIDES.length : index;
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchLandingContentServer();
  return createPublicPageMetadata({
    title: content.seo.title,
    description: content.seo.description,
    path: "/",
    image: content.seo.ogImageUrl,
    imageAlt: `${content.hero.title} — ${content.hero.tagline}`,
    keywords: [
      ...HOME_KEYWORDS,
      ...content.features.flatMap((feature) => [feature.title, ...feature.tags]),
    ],
  });
}

export default async function Page() {
  const [content, plans] = await Promise.all([fetchLandingContentServer(), fetchPublicPlansServer()]);
  // Only titles/descriptions go to the client bundle, not the full guide bodies.
  const guides = [...LEARN_ARTICLES]
    .sort((a, b) => featuredRank(a.slug) - featuredRank(b.slug))
    .map(({ slug, title, description }) => ({ slug, title, description }));

  return (
    <>
      <LandingJsonLd content={content} siteUrl={SITE_URL} offers={plansToOffers(plans)} />
      <LandingPage initialContent={content} guides={guides} />
    </>
  );
}
