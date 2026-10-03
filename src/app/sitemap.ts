import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/common/seo";

export const revalidate = 3600;

const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/download", changeFrequency: "monthly", priority: 0.7 },
] as const;

/**
 * Next.js serves this generated route at /sitemap.xml. Add future public,
 * indexable routes here; private application routes must never enter the map.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
