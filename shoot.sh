#!/usr/bin/env bash
# Run the screenshot job in Microsoft's Playwright container.
# Only Docker is needed on your machine: no Node, no browsers.
set -euo pipefail
IMAGE="mcr.microsoft.com/playwright:v1.64.1-noble"   # keep in sync with package.json

docker run --rm --init --ipc=host \
  -v "$PWD":/work -w /work \
  "$IMAGE" \
  bash -c "npm ci --no-audit --no-fund --loglevel=error && node shoot.mjs $*"
