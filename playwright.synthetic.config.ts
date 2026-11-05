import { defineConfig, devices } from "@playwright/test";

// Synthetic checks against production: no local web server, retries to ignore one-off network blips.
export default defineConfig({
  testDir: "synthetic",
  testMatch: "*.check.ts",
  retries: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "synthetic-report" }]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["iPhone 15"] } },
  ],
});
