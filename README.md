# Playwright Container Demo

Take screenshots, build a slide deck and run browser tests for any web app, **with only Docker installed**. Everything runs inside Microsoft's official Playwright image, [`mcr.microsoft.com/playwright`](https://mcr.microsoft.com/product/playwright/about), which ships Node.js and Chromium, Firefox and WebKit ready to go.

Blog post: [Playwright in a Container: Screenshots, Slides and Tests with Only Docker](https://mohiadeen-ameer.github.io/blogs/post.html?p=playwright-container)

## What's inside

| Path | What it is |
|---|---|
| `app/` | **Release Radar**, a small demo dashboard to capture and test |
| `shoot.mjs` + `shots.json` | Takes the screenshots listed in `shots.json` and builds `out/deck.pdf` |
| `tests/` + `playwright.config.ts` | Functional and visual regression tests in Chromium, WebKit and mobile |
| `shoot.sh`, `test.sh` | One-line wrappers that run everything in the container |
| `Dockerfile` | A self-contained test image built `FROM` Playwright's image |
| `compose.yaml` | A shared browser server + a test runner that connects to it |
| `synthetic/` + `playwright.synthetic.config.ts` | Scheduled checks against a live production site |
| `.github/workflows/playwright.yml` | CI: tests in 3 parallel shards + screenshots and deck |
| `.github/workflows/synthetic.yml` | Synthetic monitoring every 30 minutes |

## Quick start

You only need Docker.

```sh
# Screenshots + slide deck  ->  out/screenshots/*.png and out/deck.pdf
./shoot.sh

# Tests in Chromium, WebKit and mobile
./test.sh

# Accept the current look as the new visual baseline
./test.sh --update-snapshots
```

The first run downloads the image (about 3.5 GB). After that, a full run takes a few seconds.

## Production patterns

```sh
# 1. Bake the tests into an image (runs as non-root pwuser)
docker build -t release-radar-tests .
docker run --rm --ipc=host release-radar-tests

# 2. Shared browser server: browsers in one container, tests in another
docker compose up --build --abort-on-container-exit --exit-code-from tests

# 3. Split the suite across machines
./test.sh --shard=1/3

# 4. Synthetic monitoring of a live site (SITE_URL to point it elsewhere)
docker run --rm --ipc=host -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.64.1-noble \
  bash -c "npm ci && npx playwright test -c playwright.synthetic.config.ts"
```

## Capture your own pages

Edit `shots.json`. Each entry is one screenshot (and one slide):

```json
{
  "name": "03-release-details",
  "title": "Release details panel",
  "url": "/",
  "viewport": "desktop",
  "colorScheme": "dark",
  "click": "tr[data-release='3.0.0']",
  "waitFor": ".panel.open",
  "browser": "chromium"
}
```

- `url`: a path in `app/`, or any full `https://` URL
- `viewport`: `desktop`, `tablet` or `mobile`
- `colorScheme`: `light` or `dark`
- `browser`: `chromium`, `firefox` or `webkit`
- `click` / `waitFor`: optional selectors, to open a menu or panel before capturing
- `fullPage`: `true` to capture the whole scrolling page

## Keep versions in sync

The image tag and the npm version must match (both are **1.64.1** here):

- `shoot.sh`, `test.sh`, `.github/workflows/playwright.yml`: `mcr.microsoft.com/playwright:v1.64.1-noble`
- `package.json`: `"playwright"` and `"@playwright/test"`: `1.64.1`

If they don't match, Playwright looks for browser builds that aren't in the image.

## Notes

- Visual baselines (`tests/*-snapshots/`) are rendered on Linux inside the container. Always update them with `./test.sh --update-snapshots`, not on your Mac directly, or fonts and anti-aliasing won't match.
- `--ipc=host` is recommended by Playwright so Chromium doesn't run out of shared memory.
- The container runs as root by default. That's fine for your own app. For untrusted websites, run as the built-in `pwuser` user and see Playwright's Docker docs.
