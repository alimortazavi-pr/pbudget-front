import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME_FA } from "@/common/constants/brand";
import { absoluteUrl, breadcrumbJsonLd, createPublicPageMetadata, jsonLdGraph, SITE_URL } from "@/common/seo";
import { LearnLayout } from "@/components/pages/learn/LearnLayout";
import { LEARN_ARTICLES } from "@/content/learn";

const TITLE = "آموزش مدیریت مالی شخصی و حسابداری شخصی — بودجه‌بندی، اقساط، چک و پس‌انداز";
const DESCRIPTION =
  "راهنماهای کاربردی فارسی برای مدیریت مالی شخصی: بودجه‌بندی ماهانه، مدیریت دخل و خرج با تقویم شمسی، اقساط و چک، صندوق پس‌انداز و هدف مالی، ورود صورتحساب بانکی و انتخاب بهترین اپلیکیشن مدیریت مالی.";

export const metadata: Metadata = createPublicPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn",
  keywords: ["آموزش مدیریت مالی", "آموزش حسابداری شخصی", "راهنمای بودجه‌بندی", "آموزش پس انداز", "مدیریت دخل و خرج"],
});

export default function LearnHubPage() {
  const nodes = [
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
    breadcrumbJsonLd([
      { name: APP_NAME_FA, path: "/" },
      { name: "آموزش‌ها", path: "/learn" },
    ]),
  ];

  return (
    <LearnLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }} />
      <section className="lx-container py-14 md:py-20">
        <nav aria-label="مسیر صفحه" className="lx-muted text-xs">
          <Link href="/" className="hover:underline">{APP_NAME_FA}</Link> / آموزش‌ها
        </nav>
        <h1 className="lx-h1 mt-4">آموزش مدیریت مالی شخصی</h1>
        <p className="lx-muted mt-4 max-w-2xl text-base leading-8 md:text-lg">
          راهنماهای ساده و عملی برای کنترل پول، بودجه‌بندی، پس‌انداز و مدیریت اقساط و چک؛ نوشته‌شده برای شرایط ایران، با مثال‌های عددی.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEARN_ARTICLES.map((article) => (
            <li key={article.slug}>
              <Link href={`/learn/${article.slug}`} className="l3-card block h-full">
                <h2 className="text-lg font-bold leading-8">{article.title}</h2>
                <p className="lx-muted mt-2 text-sm leading-7">{article.description}</p>
                <p className="lx-muted mt-4 text-xs">{article.readMinutes} دقیقه مطالعه</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="lx-muted mt-10 text-sm leading-8">
          پاسخ سوال‌های رایج درباره‌ی امکانات، قیمت و حریم خصوصی را در{" "}
          <Link href="/faq" className="font-semibold text-accent hover:underline">سوالات متداول میز پردیس</Link>{" "}
          ببینید یا{" "}
          <Link href="/get-started" className="font-semibold text-accent hover:underline">حساب رایگان بسازید</Link>.
        </p>
      </section>
    </LearnLayout>
  );
}
