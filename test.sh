#!/usr/bin/env bash
# Run the Playwright tests in Microsoft's Playwright container.
#   ./test.sh                       run all tests
#   ./test.sh --update-snapshots    accept the current look as the new baseline
#   ./test.sh --project=webkit      run one browser only
set -euo pipefail
IMAGE="mcr.microsoft.com/playwright:v1.64.1-noble"   # keep in sync with package.json

docker run --rm --init --ipc=host \
  -e CI="${CI:-}" \
  -v "$PWD":/work -w /work \
  "$IMAGE" \
  bash -c "npm ci --no-audit --no-fund --loglevel=error && npx playwright test $*"
