// Connects to a Playwright browser server running in another container.
import { chromium } from "playwright";

const endpoint = process.env.PW_WS || "ws://pw-server:3000/";
const t0 = Date.now();
const browser = await chromium.connect(endpoint);
console.log(`connected to ${endpoint} in ${Date.now() - t0} ms, browser ${browser.version()}`);

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("https://mohiadeen-ameer.github.io/blogs/");
console.log("title:", await page.title());
await page.screenshot({ path: "out/remote-shot.png" });
console.log("saved out/remote-shot.png (rendered inside pw-server, saved here)");
await browser.close();
