import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME_FA } from "@/common/constants/brand";
import { absoluteUrl, createPublicPageMetadata, serializeJsonLd, SITE_URL } from "@/common/seo";
import { LearnLayout } from "@/components/pages/learn/LearnLayout";
import { LEARN_ARTICLES } from "@/content/learn";

const TITLE = "آموزش مدیریت مالی شخصی — راهنمای بودجه، اقساط، چک و پس‌انداز";
const DESCRIPTION =
  "راهنماهای کاربردی فارسی برای مدیریت مالی شخصی: بودجه‌بندی ماهانه، ثبت درآمد و هزینه، مدیریت اقساط و چک، پس‌انداز هدفمند، ورود صورتحساب بانک و ثبت با تلگرام.";

export const metadata: Metadata = createPublicPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn",
  keywords: ["آموزش مدیریت مالی", "راهنمای بودجه بندی", "آموزش پس انداز"],
});

export default function LearnHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/learn#page`,
        url: absoluteUrl("/learn"),
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: "fa-IR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: LEARN_ARTICLES.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(`/learn/${article.slug}`),
            name: article.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: APP_NAME_FA, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "آموزش‌ها", item: absoluteUrl("/learn") },
        ],
      },
    ],
  };

  return (
    <LearnLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <section className="lx-container py-14 md:py-20">
        <nav aria-label="breadcrumb" className="lx-muted text-xs">
          <Link href="/" className="hover:underline">{APP_NAME_FA}</Link> / آموزش‌ها
        </nav>
        <h1 className="lx-h1 mt-4">آموزش مدیریت مالی شخصی</h1>
        <p className="lx-muted mt-4 max-w-2xl text-base leading-8 md:text-lg">
          راهنماهای ساده و عملی برای کنترل پول، بودجه‌بندی، پس‌انداز و مدیریت اقساط و چک؛ نوشته‌شده برای شرایط ایران، با مثال‌های عددی.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEARN_ARTICLES.map((article) => (
            <Link key={article.slug} href={`/learn/${article.slug}`} className="l3-card block">
              <h2 className="text-lg font-bold leading-8">{article.title}</h2>
              <p className="lx-muted mt-2 text-sm leading-7">{article.description}</p>
              <p className="lx-muted mt-4 text-xs">{article.readMinutes} دقیقه مطالعه</p>
            </Link>
          ))}
        </div>
      </section>
    </LearnLayout>
  );
}
