import { expect, test, type Page } from "@playwright/test";

import { LEARN_ARTICLES } from "../src/content/learn";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "CCBot",
  "Bingbot",
];

/**
 * Browser-side API calls (live plans, Android app info, auth bootstrap) are
 * mocked so the public pages render the same way with or without a backend.
 * Server-rendered content falls back to the bundled defaults when the API is
 * unreachable.
 */
async function mockApi(page: Page) {
  await page.route(/\/v1\//, async (route) => {
    const url = route.request().url();
    if (url.includes("/subscriptions/plans")) {
      return route.fulfill({ status: 200, json: [] });
    }
    if (url.includes("/site/landing")) {
      return route.fulfill({ status: 404, json: { message: "not found" } });
    }
    return route.fulfill({ status: 401, json: { message: "unauthorized" } });
  });
}

async function jsonLdNodes(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const nodes: Record<string, unknown>[] = [];
  for (const block of blocks) {
    const parsed = JSON.parse(block) as Record<string, unknown>;
    const graph = (parsed["@graph"] as Record<string, unknown>[] | undefined) ?? [parsed];
    nodes.push(...graph);
  }
  return { raw: blocks.join(""), nodes };
}

function types(nodes: Record<string, unknown>[]) {
  return nodes.flatMap((node) => {
    const type = node["@type"];
    return Array.isArray(type) ? (type as string[]) : [type as string];
  });
}

test.describe("Public SEO pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("guides are readable without signing in and stay indexable", async ({ page }) => {
    await page.goto("/learn/personal-finance-guide");
    await expect(page).toHaveURL(/\/learn\/personal-finance-guide$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("مدیریت مالی شخصی");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /(^|,\s*)index/);
    // no welcome tour on a public page
    await page.waitForTimeout(2000);
    await expect(page.getByText("به میز پردیس خوش آمدید")).toHaveCount(0);
    const { nodes } = await jsonLdNodes(page);
    expect(types(nodes)).toEqual(expect.arrayContaining(["Article", "FAQPage", "BreadcrumbList"]));
  });

  test("how-to guides expose an answer-first summary and HowTo JSON-LD", async ({ page }) => {
    await page.goto("/learn/how-to-budget-monthly");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "پاسخ کوتاه" })).toBeVisible();
    await expect(page.locator("ol li")).toHaveCount(6);
    const { nodes } = await jsonLdNodes(page);
    const howTo = nodes.find((node) => node["@type"] === "HowTo");
    expect(howTo).toBeTruthy();
    expect((howTo?.step as unknown[]).length).toBe(6);
    // internal links to the funnel pages
    await expect(page.locator('a[href="/get-started"]').first()).toBeAttached();
    await expect(page.locator('a[href="/pricing"]').first()).toBeAttached();
  });

  test("landing page has one h1, canonical, fa_IR Open Graph and valid JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "fa-IR");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fa_IR");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
      links.map((link) => link.getAttribute("hreflang")),
    );
    for (const lang of hreflangs) expect(["fa-IR", "x-default"]).toContain(lang);

    const { raw, nodes } = await jsonLdNodes(page);
    expect(types(nodes)).toEqual(
      expect.arrayContaining(["WebSite", "Organization", "WebPage", "SoftwareApplication", "MobileApplication", "FAQPage"]),
    );
    expect(raw).not.toContain("aggregateRating");
    expect(raw).not.toContain('"review"');
    // No site search exists, so no SearchAction may be declared.
    expect(raw).not.toContain("SearchAction");

    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/privacy"]')).toBeAttached();
    await expect(footer.locator('a[href="/pricing"]')).toBeAttached();
    await expect(footer.locator('a[href^="/learn/"]').first()).toBeAttached();
  });

  test("pricing, download and faq carry breadcrumbs and their own JSON-LD", async ({ page }) => {
    for (const [path, expected] of [
      ["/pricing", "Product"],
      ["/download", "MobileApplication"],
      ["/faq", "FAQPage"],
    ] as const) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
      const { nodes } = await jsonLdNodes(page);
      expect(types(nodes)).toEqual(expect.arrayContaining([expected, "BreadcrumbList"]));
    }
  });

  test("private app routes are noindex", async ({ request }) => {
    for (const path of ["/app", "/settings", "/admin"]) {
      const html = await (await request.get(path)).text();
      expect(html).toMatch(/<meta name="robots" content="noindex/);
    }
  });

  test("robots.txt welcomes AI crawlers and blocks private paths", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    expect(robots).toMatch(/Host:/);
    for (const bot of AI_CRAWLERS) expect(robots).toContain(`User-Agent: ${bot}`);
    for (const path of ["/admin", "/api", "/app", "/settings"]) expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toContain("Allow: /learn");
    expect(robots).not.toContain("Disallow: /get-started");
  });

  test("sitemap lists every public page and guide, and nothing private", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/pricing", "/download", "/learn", "/faq", "/privacy"]) {
      expect(sitemap).toContain(`${path}</loc>`);
    }
    for (const article of LEARN_ARTICLES) expect(sitemap).toContain(`/learn/${article.slug}</loc>`);
    expect(sitemap).toContain("<lastmod>");
    expect(sitemap).not.toMatch(/\/(app|admin|settings|plans)<\/loc>/);
  });

  test("llms.txt follows the llms.txt layout", async ({ request }) => {
    const llms = await request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    expect(llms.headers()["content-type"]).toContain("text/plain");
    const text = await llms.text();
    expect(text.startsWith("# میز پردیس")).toBeTruthy();
    expect(text).toMatch(/\n> .+/);
    expect(text).toContain("## Guides");
    expect(text).toContain("/llms-full.txt");
    for (const article of LEARN_ARTICLES) expect(text).toContain(`/learn/${article.slug})`);
  });

  test("llms-full.txt carries the full product description, FAQ and guides", async ({ request }) => {
    const res = await request.get("/llms-full.txt");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("## English summary");
    expect(text).toContain("Paradise Desk");
    expect(text).toContain("## پلن‌ها و قیمت");
    expect(text).toContain("## سوالات متداول");
    expect(text).toContain("تقویم");
    for (const article of LEARN_ARTICLES) expect(text).toContain(`### ${article.title}`);
  });
});
