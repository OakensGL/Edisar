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
- `scripts/test-minimap.mjs` – minimap wheel zoom (1x–4x, clamped, no page scroll, wheel elsewhere untouched, −/+ buttons, saved); writes `shots/minimap-zoom.png` (run by `--test`)
- `scripts/test-coins.mjs` – tienda de Edisar Coins (prueba): tecla K/botón, Modo prueba, compras, AFK filter, Cambista Darío (1 coin = 10,000 de oro); Túnica de Nubes Rojas (Cosméticos, 🪙 90: compra, 4 direcciones a pie y montado); writes `shots/coin-store.png`, `shots/coin-exchange.png`, `shots/outfit-nubes-rojas.png`, `shots/outfit-nubes-rojas-world.png` (run by `--test`)
- `scripts/test-depot.mjs` – depósito junto al templo: abrir, arrastrar mochila↔depósito, Sacar/Guardar/Guardar todo, tooltip, Esc, persistencia; writes `shots/depot.png` (run by `--test`)
- `scripts/test-mount.mjs` – monturas: tecla R, ventana «🐎 Monturas», Burro con oro (Tomás), compra con coins (ventana y tienda), montar/bajar, Atajos, persistencia; writes `shots/mounts-window.png`, `shots/mount-riding.png` (run by `--test`)
- `scripts/test-quest.mjs` – misiones de Kiki/Marin/Shaina/Pitia, diario (J), barra de efectos; writes `shots/quest-dialog.png`, `shots/quest-log.png` (run by `--test`)
- `scripts/test-gemini.mjs` – Géminis (Otra Dimensión, gemelos), uses `dist-test/` (built by `TESTHOOK=1 node scripts/build.mjs`); writes `shots/otra-dimension.png`, `shots/gemini-fight.png` (run by `--test`)
- `scripts/test-chars.mjs` – varios personajes (hasta 6, estilo Tibia): migración de la partida única `edisar.autosave.v1` al personaje 1 (copia exacta + respaldo `edisar.autosave.v1.backup`, la clave antigua no se toca), crear/cambiar/borrar con confirmación, partidas separadas, coins y Premium de la cuenta, autoguardado al personaje activo, importar código antiguo, límite 6; writes `shots/char-select.png` (run by `--test`)
- `scripts/shot-icons.mjs` – iconos pixel-art de objetos (mochila, muñeco, depósito, tooltip con marco de rareza, tienda de Rosa comprar/vender); writes `shots/icons-backpack.png`, `shots/icons-tooltip.png`, `shots/icons-depot.png`, `shots/icons-shop.png`, `shots/icons-shop-sell.png` (run by `--test`)
- `scripts/active-shim.mjs` – test helper: the pseudo-key `@active` maps to the save of the last played character (`edisar.char.<id>`), so older tests keep reading/writing "the save"
- Storage keys: `edisar.account.v1` (lista de personajes, último jugado, Edisar Coins y Premium de la cuenta), `edisar.char.c1…` (código EDISAR2 de cada personaje), `edisar.autosave.v1` (partida antigua, solo lectura/respaldo)
- `scripts/test.mjs` – puppeteer-core + /usr/bin/google-chrome tests over file:// and http://; screenshots to `shots/`
