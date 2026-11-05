// Takes screenshots listed in shots.json and builds a slide deck (PDF) from them.
// Runs inside mcr.microsoft.com/playwright, so no browsers are needed on the host.
//
//   node shoot.mjs [--config shots.json] [--out out]

import { chromium, firefox, webkit, devices } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve, normalize } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
);
const configPath = args.config || "shots.json";
const outDir = resolve(args.out || "out");
const shotsDir = join(outDir, "screenshots");

const config = JSON.parse(await readFile(configPath, "utf8"));
const engines = { chromium, firefox, webkit };
const viewports = {
  desktop: { viewport: { width: 1440, height: 640 }, deviceScaleFactor: 2 },
  tablet: { ...devices["iPad Pro 11"] },
  mobile: { ...devices["iPhone 15"] },
};

// 1. Serve ./app on a local port so the demo app can be captured like a real site.
const appRoot = resolve("app");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  const file = join(appRoot, path.endsWith("/") ? path + "index.html" : path);
  if (!file.startsWith(appRoot)) { res.writeHead(403).end(); return; }
  try {
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

// 2. Take each screenshot in a fresh browser context.
await mkdir(shotsDir, { recursive: true });
const browsers = {};
const results = [];
const started = Date.now();

for (const shot of config.shots) {
  const engine = shot.browser || "chromium";
  browsers[engine] ||= await engines[engine].launch();
  const { defaultBrowserType, ...device } = viewports[shot.viewport || "desktop"];
  const context = await browsers[engine].newContext({ ...device, colorScheme: shot.colorScheme || "light" });
  const page = await context.newPage();
  const url = shot.url.startsWith("http") ? shot.url : base + shot.url;

  const t0 = Date.now();
  await page.goto(url, { waitUntil: "networkidle" });
  if (shot.click) await page.click(shot.click);
  if (shot.waitFor) await page.waitForSelector(shot.waitFor);
  await page.waitForTimeout(shot.settleMs ?? 300); // let animations finish
  const file = join(shotsDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: !!shot.fullPage });
  await context.close();

  results.push({ ...shot, file, ms: Date.now() - t0 });
  console.log(`✓ ${shot.name.padEnd(28)} ${engine.padEnd(8)} ${String(Date.now() - t0).padStart(5)} ms`);
}

// 3. Build a 16:9 slide deck: a title slide plus one slide per screenshot.
const slides = [
  `<section class="slide title"><h1>${config.deckTitle}</h1><p>${config.deckSubtitle || ""}</p>
   <small>${results.length} screenshots · generated ${new Date().toISOString().slice(0, 10)}</small></section>`,
];
for (const r of results) {
  const img = (await readFile(r.file)).toString("base64");
  slides.push(`<section class="slide"><header><h2>${r.title || r.name}</h2>
    <span>${r.browser || "chromium"} · ${r.viewport || "desktop"} · ${r.colorScheme || "light"}</span></header>
    <div class="shot"><img src="data:image/png;base64,${img}"></div></section>`);
}
const deckHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: 13.333in 7.5in; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
  .slide { width: 13.333in; height: 7.5in; page-break-after: always; background: #0b0d17; color: #eef0fa;
           padding: .45in .6in; display: flex; flex-direction: column; }
  .slide.title { justify-content: center; background: linear-gradient(135deg, #1e1b4b, #0b0d17 60%, #042f2e); }
  .title h1 { font-size: 46pt; margin: 0 0 10pt; letter-spacing: -1pt; }
  .title p { font-size: 18pt; color: #b4b8cc; margin: 0 0 24pt; }
  .title small { color: #7f849c; font-size: 12pt; }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14pt; }
  h2 { font-size: 22pt; margin: 0; }
  header span { color: #8b85ff; font: 11pt ui-monospace, monospace; }
  .shot { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .shot img { max-width: 100%; max-height: 100%; border-radius: 10pt; box-shadow: 0 10pt 30pt rgba(0,0,0,.5); }
</style></head><body>${slides.join("")}</body></html>`;

await writeFile(join(outDir, "deck.html"), deckHtml);
browsers.chromium ||= await chromium.launch(); // PDF export needs Chromium
const deckPage = await browsers.chromium.newPage();
await deckPage.setContent(deckHtml, { waitUntil: "load" });
await deckPage.pdf({ path: join(outDir, "deck.pdf"), width: "13.333in", height: "7.5in", printBackground: true });

for (const b of Object.values(browsers)) await b.close();
server.close();
console.log(`\n${results.length} screenshots + deck.pdf in ${outDir} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
