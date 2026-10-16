import type { MetadataRoute } from "next";

import { AI_CRAWLERS, PRIVATE_PATH_PREFIXES, SITE_URL } from "@/common/seo";

const PUBLIC_PATHS = ["/", "/pricing", "/download", "/learn", "/faq", "/privacy", "/get-started", "/llms.txt", "/llms-full.txt"];
const PRIVATE_PATHS = [...PRIVATE_PATH_PREFIXES];

/**
 * Everything public is crawlable. A crawler that matches a named group ignores
 * the "*" group, so the AI/answer-engine group repeats the full private list.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: PUBLIC_PATHS, disallow: PRIVATE_PATHS },
      // AI assistants and answer engines are welcome: the public pages are
      // written to be quoted (see /llms.txt and /llms-full.txt).
      { userAgent: [...AI_CRAWLERS], allow: PUBLIC_PATHS, disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
