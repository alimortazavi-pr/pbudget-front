import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  createPublicPageMetadata,
  faqPageJsonLd,
  jsonLdGraph,
  SITE_URL,
} from "@/common/seo";
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
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: article.published,
      modifiedTime: article.updated,
      section: "آموزش مدیریت مالی شخصی",
      tags: article.keywords,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const url = absoluteUrl(`/learn/${article.slug}`);
  const related = article.related.map((s) => getArticle(s)).filter((a) => a !== undefined);
  const nodes: unknown[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: article.title,
      description: article.description,
      ...(article.summary ? { abstract: article.summary } : {}),
      inLanguage: "fa-IR",
      datePublished: article.published,
      dateModified: article.updated,
      keywords: article.keywords.join("، "),
      articleSection: "آموزش مدیریت مالی شخصی",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
      image: absoluteUrl("/assets/og-landing.png"),
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#software` },
    },
    faqPageJsonLd(article.faq, `${url}#faq`),
    breadcrumbJsonLd([
      { name: APP_NAME_FA, path: "/" },
      { name: "آموزش‌ها", path: "/learn" },
      { name: article.title, path: `/learn/${article.slug}` },
    ]),
  ];
  if (article.howTo) {
    nodes.push({
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: article.howTo.name,
      description: article.summary ?? article.description,
      inLanguage: "fa-IR",
      ...(article.howTo.totalTime ? { totalTime: article.howTo.totalTime } : {}),
      step: article.howTo.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
        url: `${url}#step-${index + 1}`,
      })),
    });
  }

  return (
    <LearnLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }} />
      <article className="lx-container max-w-3xl py-12 md:py-16">
        <nav aria-label="مسیر صفحه" className="lx-muted text-xs">
          <Link href="/" className="hover:underline">{APP_NAME_FA}</Link> / <Link href="/learn" className="hover:underline">آموزش‌ها</Link>
        </nav>
        <header>
          <h1 className="lx-h1 mt-4 !text-3xl md:!text-5xl">{article.title}</h1>
          <p className="lx-muted mt-3 text-xs">
            {article.readMinutes} دقیقه مطالعه · به‌روزرسانی:{" "}
            <time dateTime={article.updated}>{new Date(article.updated).toLocaleDateString("fa-IR")}</time>
          </p>
        </header>
        {article.summary ? (
          <section aria-labelledby="summary-heading" className="lx-card mt-6 !p-5">
            <h2 id="summary-heading" className="text-sm font-bold">پاسخ کوتاه</h2>
            <p className="mt-2 text-base leading-8">{article.summary}</p>
          </section>
        ) : null}
        <p className="mt-6 text-lg leading-9">{article.intro}</p>

        <div className="pb-prose">
          {article.howTo ? (
            <section aria-labelledby="howto-heading">
              <h2 id="howto-heading">{article.howTo.name}</h2>
              <ol>
                {article.howTo.steps.map((step, index) => (
                  <li key={step.name} id={`step-${index + 1}`}>
                    <strong>{step.name}:</strong> {step.text}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

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
              {section.links?.length ? (
                <p className="text-sm">
                  بیشتر بخوانید:{" "}
                  {section.links.map((link, index) => (
                    <span key={link.href}>
                      {index > 0 ? "، " : null}
                      <Link href={link.href}>{link.label}</Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </section>
          ))}

          <section>
            <h2>سوالات متداول</h2>
            {article.faq.map((item) => (
              <details key={item.q} className="lx-faq lx-card group !p-0" open>
                <summary className="px-5 py-4 font-semibold">
                  <h3 className="inline text-base">{item.q}</h3>
                </summary>
                <p className="lx-muted px-5 pb-5 text-sm leading-8">{item.a}</p>
              </details>
            ))}
          </section>
        </div>

        <aside className="l3-cta mt-12 !rounded-3xl !p-8 text-center">
          <h2 className="text-2xl font-extrabold">همین امروز شروع کنید</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-8 opacity-90">
            ثبت درآمد و هزینه، بودجه، اقساط و چک با تقویم شمسی؛ پلن رایگان، بدون کارت بانکی.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={PATHS.GET_STARTED} className="lx-btn bg-white text-rose-600 shadow-xl">ساخت حساب رایگان</Link>
            <Link href={PATHS.PRICING} className="lx-btn border border-white/40 bg-white/10 text-white">مقایسه‌ی پلن‌ها</Link>
            <Link href={PATHS.DOWNLOAD} className="lx-btn border border-white/40 bg-white/10 text-white">دانلود اپ اندروید</Link>
          </div>
        </aside>

        {related.length ? (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-extrabold">مطالب مرتبط</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/learn/${item.slug}`} className="l3-card block h-full !p-4 text-sm font-semibold leading-7">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </LearnLayout>
  );
}
