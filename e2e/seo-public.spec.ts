import { expect, test } from "@playwright/test";

test.describe("Public SEO pages", () => {
  test("guides are readable without signing in and stay indexable", async ({ page }) => {
    await page.goto("/learn/personal-finance-guide");
    await expect(page).toHaveURL(/\/learn\/personal-finance-guide$/);
    await expect(page.locator("h1")).toContainText("مدیریت مالی شخصی");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
    // no welcome tour on a public page
    await page.waitForTimeout(2000);
    await expect(page.getByText("به میز پردیس خوش آمدید")).toHaveCount(0);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join("")).toContain("FAQPage");
  });

  test("robots, sitemap and llms.txt are served", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/learn/personal-finance-guide");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    const llms = await request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    expect(await llms.text()).toContain("میز پردیس");
  });
});
