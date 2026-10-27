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
[ "$TEST" = 1 ] && TESTHOOK=1 node scripts/build.mjs
if [ "$TEST" = 1 ]; then node scripts/test.mjs; node scripts/test-ui.mjs; node scripts/test-minimap.mjs; node scripts/test-coins.mjs; node scripts/test-depot.mjs; node scripts/test-mount.mjs; node scripts/test-quest.mjs; node scripts/test-gemini.mjs; node scripts/test-chars.mjs; node scripts/shot-icons.mjs; node scripts/test-croqui.mjs; node scripts/test-demon.mjs; fi
