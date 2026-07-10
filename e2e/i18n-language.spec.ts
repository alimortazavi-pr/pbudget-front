import { test, expect } from "@playwright/test";

test.describe("Language switching", () => {
  test.setTimeout(60_000);

  test("landing page switches to English", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-selector-trigger").click();
    await page.getByTestId("language-option-en").click();

    await expect(
      page.getByText("Personal finance, projects & daily planning").first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("landing page switches to Arabic", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-selector-trigger").click();
    await page.getByTestId("language-option-ar").click();

    await expect(page.getByText("إدارة مالية شخصية ومشاريع وتخطيط يومي").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("download page switches to English", async ({ page }) => {
    await page.goto("/download");

    await page.getByTestId("language-selector-trigger").click();
    await page.getByTestId("language-option-en").click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Financial desk & planning",
      { timeout: 15_000 },
    );
  });
});
