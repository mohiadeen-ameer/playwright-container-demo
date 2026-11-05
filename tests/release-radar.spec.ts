import { test, expect } from "@playwright/test";

test.describe("Release Radar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ---- Functional tests: does the app behave correctly? ----

  test("lists every release with its status", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(5);
    await expect(rows.filter({ hasText: "inventory" })).toContainText("rolled back");
  });

  test("shows the four delivery metrics", async ({ page }) => {
    const kpis = page.locator(".kpi");
    await expect(kpis).toHaveCount(4);
    await expect(kpis.first()).toContainText("Deploys");
    await expect(kpis.first()).toContainText("42");
  });

  test("clicking a release opens its details, and × closes them", async ({ page }) => {
    const panel = page.locator("#panel");
    await expect(panel).toBeHidden();

    await page.getByRole("cell", { name: "inventory" }).click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("lock contention under load");

    await page.getByRole("button", { name: "Close" }).click();
    await expect(panel).toBeHidden();
  });

  // ---- Visual regression tests: does it still look the same? ----

  test("dashboard looks right (light)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page).toHaveScreenshot("dashboard-light.png", { fullPage: true });
  });

  test("dashboard looks right (dark)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page).toHaveScreenshot("dashboard-dark.png", { fullPage: true });
  });

  test("details panel looks right", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("cell", { name: "inventory" }).click();
    await expect(page.locator("#panel")).toBeVisible();
    await expect(page.locator("#panel")).toHaveScreenshot("details-panel.png");
  });
});
