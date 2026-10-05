import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { absoluteUrl, createPublicPageMetadata, serializeJsonLd, SITE_URL } from "@/common/seo";
import { LearnLayout } from "@/components/pages/learn/LearnLayout";
import { getArticle, LEARN_ARTICLES } from "@/content/learn";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEARN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const base = createPublicPageMetadata({
    title: `${article.title} | ${APP_NAME_FA}`,
    description: article.description,
    path: `/learn/${article.slug}`,
    keywords: article.keywords,
    type: "article",
  });
  return {
    ...base,
    openGraph: { ...base.openGraph, type: "article", publishedTime: article.published, modifiedTime: article.updated },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const url = absoluteUrl(`/learn/${article.slug}`);
  const related = article.related.map((s) => getArticle(s)).filter((a) => a !== undefined);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        inLanguage: "fa-IR",
        datePublished: article.published,
        dateModified: article.updated,
        keywords: article.keywords.join("، "),
        mainEntityOfPage: url,
        image: absoluteUrl("/assets/og-landing.png"),
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: APP_NAME_FA, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "آموزش‌ها", item: absoluteUrl("/learn") },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  };

  return (
    <LearnLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <article className="lx-container max-w-3xl py-12 md:py-16">
        <nav aria-label="breadcrumb" className="lx-muted text-xs">
          <Link href="/" className="hover:underline">{APP_NAME_FA}</Link> / <Link href="/learn" className="hover:underline">آموزش‌ها</Link>
        </nav>
        <h1 className="lx-h1 mt-4 !text-3xl md:!text-5xl">{article.title}</h1>
        <p className="lx-muted mt-3 text-xs">
          {article.readMinutes} دقیقه مطالعه · به‌روزرسانی:{" "}
          <time dateTime={article.updated}>{new Date(article.updated).toLocaleDateString("fa-IR")}</time>
        </p>
        <p className="mt-6 text-lg leading-9">{article.intro}</p>

        <div className="pb-prose">
          {article.sections.map((section) => (
            <section key={section.h2}>
              <h2>{section.h2}</h2>
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section>
            <h2>سوالات متداول</h2>
            {article.faq.map((item) => (
              <details key={item.q} className="lx-faq lx-card group !p-0" open>
                <summary className="px-5 py-4 font-semibold">{item.q}</summary>
                <p className="lx-muted px-5 pb-5 text-sm leading-8">{item.a}</p>
              </details>
            ))}
          </section>
        </div>

        <aside className="l3-cta mt-12 !rounded-3xl !p-8 text-center">
          <h2 className="text-2xl font-extrabold">همین امروز شروع کنید</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-8 opacity-90">
            ثبت درآمد و هزینه، بودجه، اقساط و چک با تقویم شمسی؛ رایگان و بدون کارت بانکی.
          </p>
          <Link href={PATHS.GET_STARTED} className="lx-btn mt-6 bg-white text-rose-600 shadow-xl">ساخت حساب رایگان</Link>
        </aside>

        {related.length ? (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold">بخوانید</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/learn/${item.slug}`} className="l3-card block !p-4 text-sm font-semibold leading-7">
                  {item.title.split("؛")[0]}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </LearnLayout>
  );
}
