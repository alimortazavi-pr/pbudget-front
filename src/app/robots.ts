import type { MetadataRoute } from "next";

import { SITE_URL } from "@/common/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/download", "/learn", "/llms.txt", "/llms-full.txt"],
        disallow: [
          "/admin",
          "/api",
          "/app",
          "/analysis",
          "/bank-import",
          "/boxes",
          "/budgets",
          "/checks",
          "/commitments",
          "/create-budget",
          "/debts",
          "/exports",
          "/get-started",
          "/installments",
          "/invites",
          "/landing-preview",
          "/notes",
          "/partner-invite",
          "/payment-cards",
          "/planning",
          "/plans",
          "/profile",
          "/projects",
          "/settings",
          "/tasks",
          "/ventures",
          "/workspace",
          "/~offline",
        ],
      },
      // AI assistants and answer engines are welcome: the public pages are
      // written to be quoted (see /llms.txt).
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "Bingbot",
          "YandexBot",
        ],
        allow: ["/", "/pricing", "/download", "/learn", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin", "/api", "/app", "/get-started", "/workspace", "/partner-invite"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
