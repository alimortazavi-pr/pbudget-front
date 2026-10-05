import { absoluteUrl, SITE_URL } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";

export const revalidate = 3600;

/** Full text of every public guide in one file, for retrieval by AI systems. */
export function GET() {
  const parts: string[] = [
    "# میز پردیس (Paradise Desk) — full content",
    "",
    `Source: ${SITE_URL}`,
    "",
  ];
  for (const article of LEARN_ARTICLES) {
    parts.push(`## ${article.title}`, `URL: ${absoluteUrl(`/learn/${article.slug}`)}`, `Updated: ${article.updated}`, "", article.intro, "");
    for (const section of article.sections) {
      parts.push(`### ${section.h2}`, ...section.paragraphs);
      if (section.bullets) parts.push(...section.bullets.map((bullet) => `- ${bullet}`));
      parts.push("");
    }
    parts.push("### FAQ");
    for (const item of article.faq) parts.push(`Q: ${item.q}`, `A: ${item.a}`, "");
    parts.push("---", "");
  }
  return new Response(parts.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
