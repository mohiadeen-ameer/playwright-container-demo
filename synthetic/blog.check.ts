// Synthetic monitoring: checks a LIVE production site the way a user would.
// Runs on a schedule (see .github/workflows/synthetic.yml); a failure means users are affected.
import { test, expect } from "@playwright/test";

const SITE = process.env.SITE_URL || "https://mohiadeen-ameer.github.io/blogs/";

test("home page loads fast and lists posts", async ({ page }) => {
  const t0 = Date.now();
  await page.goto(SITE);
  await expect(page.locator(".card").first()).toBeVisible();
  const ms = Date.now() - t0;
  console.log(`home page ready in ${ms} ms`);
  expect(ms, "home page should be usable within 5 s").toBeLessThan(5000);
});

test("a post opens and its diagrams render", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));

  await page.goto(SITE);
  await page.locator(".card").first().click();
  await expect(page.locator("h1.post-title")).toBeVisible();
  await expect(page.locator("figure.diagram svg").first()).toBeVisible({ timeout: 15_000 });
  expect(errors, "no JavaScript errors on the page").toEqual([]);
});

test("About page has working contact links", async ({ page, request }) => {
  await page.goto(SITE + "about.html");
  const linkedin = page.getByRole("link", { name: /LinkedIn/ }).first();
  await expect(linkedin).toHaveAttribute("href", /linkedin\.com\/in\//);
  const res = await request.get(SITE + "posts.json");
  expect(res.ok()).toBeTruthy();
});
