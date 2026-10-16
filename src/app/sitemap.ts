import type { MetadataRoute } from "next";

import { absoluteUrl, SITE_LAST_UPDATED } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";

export const revalidate = 3600;

type PublicRoute = {
  path: `/${string}` | "/";
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  lastModified?: string;
};

const latestGuideUpdate = LEARN_ARTICLES.reduce(
  (latest, article) => (article.updated > latest ? article.updated : latest),
  SITE_LAST_UPDATED,
);

const publicRoutes: PublicRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/download", changeFrequency: "monthly", priority: 0.8 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.8, lastModified: latestGuideUpdate },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/get-started", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Next.js serves this generated route at /sitemap.xml. Add future public,
 * indexable routes here; private application routes (PRIVATE_PATH_PREFIXES
 * in src/common/seo.ts) must never enter the map.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = publicRoutes.map(({ path, changeFrequency, priority, lastModified }) => ({
    url: absoluteUrl(path),
    lastModified: new Date(lastModified ?? SITE_LAST_UPDATED),
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
