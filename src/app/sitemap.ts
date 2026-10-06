import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";

export const revalidate = 3600;

const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/download", changeFrequency: "monthly", priority: 0.7 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
] as const;

/**
 * Next.js serves this generated route at /sitemap.xml. Add future public,
 * indexable routes here; private application routes must never enter the map.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
  const guides = LEARN_ARTICLES.map((article) => ({
    url: absoluteUrl(`/learn/${article.slug}`),
    lastModified: new Date(article.updated),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...pages, ...guides];
}
