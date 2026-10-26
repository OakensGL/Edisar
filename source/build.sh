#!/usr/bin/env bash
# Rebuild Edisar standalone.  Usage:
#   ./build.sh                      # build from src/game.canvas.tsx
#   ./build.sh <ReadCanvas-output>  # first refresh src/game.canvas.tsx from a ReadCanvas dump, then build
#   ./build.sh --test               # build + run headless tests (also accepts a dump path before --test)
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
TEST=0; for a in "$@"; do if [ "$a" = "--test" ]; then TEST=1; else node scripts/extract-canvas.mjs "$a" src/game.canvas.tsx; fi; done
node scripts/build.mjs
if [ "$TEST" = 1 ]; then node scripts/test.mjs; node scripts/test-ui.mjs; fi
