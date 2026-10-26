# Edisar – standalone build

Turns the Grok Page canvas (canvas_id 83c982cd-8973-45aa-873c-9eabb359d886) into one self-contained `dist/index.html` + `dist/edisar.zip` (itch.io HTML5: index.html at zip root).

## Rebuild after the canvas changes
1. In Grok: ReadCanvas canvas_id `83c982cd-8973-45aa-873c-9eabb359d886` with `write_to_file: true` → gives `/workspace/agent-tools/<id>.txt`
2. `cd /workspace/edisar-web && ./build.sh /workspace/agent-tools/<id>.txt --test`
   (`./build.sh` alone rebuilds from the existing src/game.canvas.tsx; `node scripts/test.mjs --quick` skips the 30 s autosave wait)

## Files
- `src/game.canvas.tsx` – canvas source, never hand-edited (extracted by `scripts/extract-canvas.mjs`)
- `src/grok-canvas-shim.tsx` – replaces `grok/canvas`: React re-exports, exact Grok dark theme tokens, minimal Page/Section/Text/Callout/Divider
- `src/main.tsx` – mounts the app into #root; provides `__edisarHookSave` (save on beforeunload / pagehide / visibilitychange→hidden)
- `scripts/build.mjs` – esbuild bundle + build-time patch that hooks the game's own `autosave()` into the above (warns if the anchor text disappears)
- `scripts/test-ui.mjs` – tooltip hover/Shift compare + H→Atajos check (run by `--test`)
- `scripts/test.mjs` – puppeteer-core + /usr/bin/google-chrome tests over file:// and http://; screenshots to `shots/`
