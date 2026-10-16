import { absoluteUrl, SITE_URL } from "@/common/seo";
import { SITE_FAQ } from "@/content/faq";
import { LEARN_ARTICLES } from "@/content/learn";
import { PRODUCT_FACTS, PRODUCT_SUMMARY_EN } from "@/content/product-facts";

export const revalidate = 3600;

/**
 * Full, factual description of the product plus every public guide in one
 * Markdown file, for retrieval by AI systems (https://llmstxt.org).
 */
export function GET() {
  const parts: string[] = [
    "# میز پردیس (Paradise Desk) — شرح کامل",
    "",
    "> اپلیکیشن فارسی مدیریت مالی شخصی و حسابداری شخصی با تقویم شمسی، برای وب، PWA و اندروید.",
    "",
    "## English summary",
    "",
    PRODUCT_SUMMARY_EN,
    "",
    `Website: ${SITE_URL} · Pricing: ${absoluteUrl("/pricing")} · Android: ${absoluteUrl("/download")} · FAQ: ${absoluteUrl("/faq")} · Privacy: ${absoluteUrl("/privacy")}`,
    "The rest of this document is in Persian.",
    "",
  ];

  for (const section of PRODUCT_FACTS) {
    parts.push(`## ${section.title}`, "");
    if (section.paragraphs) parts.push(...section.paragraphs.flatMap((paragraph) => [paragraph, ""]));
    if (section.bullets) parts.push(...section.bullets.map((bullet) => `- ${bullet}`), "");
  }

  parts.push("## سوالات متداول", "", `منبع: ${absoluteUrl("/faq")}`, "");
  for (const group of SITE_FAQ) {
    parts.push(`### ${group.title}`, "");
    for (const item of group.items) parts.push(`**${item.q}**`, "", item.a, "");
  }

  parts.push("## آموزش‌ها", "", `فهرست: ${absoluteUrl("/learn")}`, "");
  for (const article of LEARN_ARTICLES) {
    parts.push(
      `### ${article.title}`,
      "",
      `URL: ${absoluteUrl(`/learn/${article.slug}`)} · Updated: ${article.updated}`,
      "",
    );
    if (article.summary) parts.push(`پاسخ کوتاه: ${article.summary}`, "");
    parts.push(article.intro, "");
    if (article.howTo) {
      parts.push(`#### ${article.howTo.name}`, "");
      article.howTo.steps.forEach((step, index) => parts.push(`${index + 1}. ${step.name}: ${step.text}`));
      parts.push("");
    }
    for (const section of article.sections) {
      parts.push(`#### ${section.h2}`, "", ...section.paragraphs.flatMap((paragraph) => [paragraph, ""]));
      if (section.bullets) parts.push(...section.bullets.map((bullet) => `- ${bullet}`), "");
    }
    parts.push("#### سوالات متداول", "");
    for (const item of article.faq) parts.push(`**${item.q}**`, "", item.a, "");
    parts.push("---", "");
  }

  return new Response(parts.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
