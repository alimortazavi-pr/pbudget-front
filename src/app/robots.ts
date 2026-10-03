import type { MetadataRoute } from "next";

import { SITE_URL } from "@/common/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/download"],
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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
