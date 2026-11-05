import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // When PW_WS is set, use a remote browser server (see compose.yaml) instead of local browsers.
    // exposeNetwork lets the remote browser reach this container's localhost (the app under test).
    ...(process.env.PW_WS
      ? { connectOptions: { wsEndpoint: process.env.PW_WS, exposeNetwork: "<loopback>" } }
      : {}),
  },
  expect: {
    // Pixel-perfect: the container renders identically everywhere, so no fuzz is needed.
    toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled" },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node serve.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
