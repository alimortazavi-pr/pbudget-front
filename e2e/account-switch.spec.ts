import { test, expect, type BrowserContext } from "@playwright/test";

/**
 * Account switching with a mocked API (no backend needed).
 * Regression guard: the axios interceptor used to overwrite the token the
 * switcher sent, so "switch" checked the current account and corrupted the
 * saved account list.
 */
const API = process.env.E2E_API_ORIGIN ?? "http://localhost:7701";

const accounts = {
  "token-a": { _id: "a".repeat(24), firstName: "سارا", lastName: "الف", mobile: "09120000001" },
  "token-b": { _id: "b".repeat(24), firstName: "مریم", lastName: "ب", mobile: "09120000002" },
  "token-expired": { _id: "c".repeat(24), firstName: "کیان", lastName: "ج", mobile: "09120000003" },
} as const;

type Token = keyof typeof accounts;

function profile(token: Token) {
  return {
    ...accounts[token],
    budget: 0,
    walletBalances: { toman: 0, usd: 0, dinar: 0 },
    isVerifiedMobile: true,
    hasAnyBudget: false,
    preferences: { currency: "toman", dateCalendar: "jalali", moneyDisplayUnit: "toman", configured: true },
  };
}

/** Tokens sent to /auth/check, in order. */
let checkCalls: string[] = [];

async function mockApi(context: BrowserContext) {
  checkCalls = [];
  await context.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 });
    const token = (request.headers()["authorization"] ?? "").replace(/^Bearer\s+/i, "") as Token;
    if (new URL(request.url()).pathname.endsWith("/auth/check")) checkCalls.push(token);
    const valid = token in accounts && token !== "token-expired";
    if (!valid) return route.fulfill({ status: 401, json: { message: "Unauthorized" } });
    const url = new URL(request.url());
    if (url.pathname.endsWith("/auth/check") || url.pathname.endsWith("/users/profile")) {
      return route.fulfill({ json: { user: profile(token) } });
    }
    if (url.pathname.includes("/categories")) return route.fulfill({ json: { categories: [] } });
    if (url.pathname.includes("/subscriptions/me")) {
      return route.fulfill({ json: { subscription: null, features: [], daysRemaining: null } });
    }
    return route.fulfill({ json: {} });
  });
}

async function setAccounts(context: BrowserContext, active: Token, list: Token[]) {
  const users = list.map((token) => ({ ...accounts[token], token }));
  await context.addCookies([
    {
      name: "pdesk-personal-auth",
      value: encodeURIComponent(JSON.stringify({ token: active, users })),
      url: "http://127.0.0.1:7711",
    },
  ]);
  await context.addInitScript(() => {
    try {
      localStorage.setItem("pbudget-onboarding-done", "1");
      localStorage.setItem("pbudget-last-seen-version", "99.0.0");
      localStorage.setItem("pwa-install-dismissed", "1");
    } catch {}
  });
}

async function activeToken(context: BrowserContext) {
  const cookie = (await context.cookies()).find((c) => c.name === "pdesk-personal-auth");
  return cookie ? (JSON.parse(decodeURIComponent(cookie.value)) as { token: string; users: unknown[] }) : null;
}

test.describe("Account switching", () => {
  test.setTimeout(90_000);

  test("switches to the other account and back", async ({ page, context }) => {
    await mockApi(context);
    await setAccounts(context, "token-a", ["token-a", "token-b"]);
    await page.goto("/profile");

    await expect.poll(() => checkCalls.length).toBeGreaterThan(0);
    checkCalls = [];
    await page.getByRole("button", { name: "تغییر حساب" }).first().click();
    await page.getByRole("button", { name: /مریم/ }).click();
    await expect.poll(async () => (await activeToken(context))?.token).toBe("token-b");
    // The switcher must verify the *target* account's session, not the current one.
    expect(checkCalls[0]).toBe("token-b");
    await expect.poll(async () => (await activeToken(context))?.users.length).toBe(2);

    await page.getByRole("button", { name: "تغییر حساب" }).first().click();
    await page.getByRole("button", { name: /سارا/ }).click();
    await expect.poll(async () => (await activeToken(context))?.token).toBe("token-a");
    await expect.poll(async () => (await activeToken(context))?.users.length).toBe(2);
  });

  test("an expired account is removed without signing out the current one", async ({ page, context }) => {
    await mockApi(context);
    await setAccounts(context, "token-a", ["token-a", "token-expired"]);
    await page.goto("/profile");

    await page.getByRole("button", { name: "تغییر حساب" }).first().click();
    await page.getByRole("button", { name: /کیان/ }).click();

    await expect.poll(async () => (await activeToken(context))?.users.length).toBe(1);
    expect((await activeToken(context))?.token).toBe("token-a");
  });

  test("an expired current session continues with the next account", async ({ page, context }) => {
    await mockApi(context);
    await setAccounts(context, "token-expired", ["token-expired", "token-b"]);
    await page.goto("/profile");

    await expect.poll(async () => (await activeToken(context))?.token).toBe("token-b");
    await expect.poll(async () => (await activeToken(context))?.users.length).toBe(1);
  });

  test("the desktop sidebar lists every menu item once", async ({ page, context }) => {
    await mockApi(context);
    await setAccounts(context, "token-a", ["token-a"]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/profile");
    const aside = page.locator("aside").first();
    await expect(aside.getByRole("link", { name: "تنظیمات" }).first()).toBeVisible();
    const labels = (await aside.locator("a,button").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    expect(duplicates).toEqual([]);
  });
});
