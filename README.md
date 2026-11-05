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
| `.github/workflows/playwright.yml` | The same container in GitHub Actions |

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
