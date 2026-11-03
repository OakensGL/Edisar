import path from "node:path"; import fs from "node:fs";
const G = process.env.GAME_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const puppeteer = (await import(path.join(G, "node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"))).default;
const { activeShim } = await import(path.join(G, "scripts/active-shim.mjs"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const K = "@active";
const seed = (fn, arg) => page.evaluate((k, src, a) => {
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  (0, eval)(src)(d, a);
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K, fn.toString(), arg);
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const ev = (fn, a) => page.evaluate(fn, a);
const status = () => ev(() => globalThis.__edisarG.current.status || "");
const at = () => ev(() => [globalThis.__edisarG.current.p.x, globalThis.__edisarG.current.p.y]);
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", f) }); };
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; g.heldDirs = []; g.zone = ""; }, [x, y]);
const key = async (k, hold = 140) => { await page.keyboard.down(k); await sleep(hold); await page.keyboard.up(k); await sleep(500); };
const click = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (b) b.click(); return !!b; }, sel);
const select = async (sel, v) => { await page.select(sel, v); await sleep(80); };
const EXP = (L) => Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12));
const newChar = async (cls, name, L, extra) => {
  await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(500);
  await page.select('select[aria-label="Vocación"]', cls); await page.type("input", name);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1000);
  await page.reload(); await sleep(400);
  await seed((d, a) => { d.level = a.L; d.exp = a.exp; d.hpPot = 300; d.manaPot = 300; d.cleared = a.cleared; if (a.extra) Object.assign(d, a.extra); }, { L, exp: EXP(L), cleared: 11, extra });
  await page.reload(); await sleep(500); await cont(); await sleep(1300);
};
const OY = 32;
// --- White Knight: mapa oficial (torre de Juan Carlos), respawns, caminar hasta la torre, marcadores del editor ---
await newChar("knight", "Caballera", 55);
const s0 = await ev(() => { const g = globalThis.__edisarG.current; const W = g.tiles.length / 144; const wk = g.mons.filter((m) => m.def.id === "wknight"), bo = g.mons.filter((m) => m.def.id === "boris");
  return { stone: g.tiles[62 * W + 8], wk: wk.length, inTower: wk.every((m) => m.x >= 2 && m.x <= 18 && m.y >= 60 && m.y <= 101), boris: bo.map((m) => [m.x, m.y]), look: wk[0] && wk[0].def.look.body }; });
// v27.2: tierra de ceniza, puertas estilo Tibia (clic derecho) y NPC de la villa en una plaza
const G_ = () => globalThis.__edisarG.current;
await newChar("knight", "Caballera", 60);
// ---------- A) Tierra de ceniza ----------
const a0 = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; let ash = 0, grass = 0; for (let y = 87; y <= 101; y++) for (let x = 55; x <= 91; x++) { if (x >= 47 && x <= 49) continue; const t = g.tiles[y * W + x]; if (t === 74) ash++; if (t === 0) grass++; } return { ash, grass }; });
check("la hierba del Bosque Muerto es «Tierra de ceniza» (tile 74)", a0.ash > 100 && a0.grass === 0, JSON.stringify(a0));
// objetos del editor sobre la ceniza (árboles secos, huesos, esqueleto, piedritas): debajo se ve ceniza, no hierba verde
const OBJ = [[60, 92, 71], [62, 92, 63], [61, 94, 64], [63, 94, 69], [59, 95, 71], [64, 96, 63]];
await ev((O) => { const g = globalThis.__edisarG.current; for (const [x, y, t] of O) { g.tiles[y * 544 + x] = t; if (g.under) g.under[y * 544 + x] = 0; } for (const m of g.mons) if (Math.abs(m.x - 61) < 8 && Math.abs(m.y - 94) < 6) m.alive = false; }, OBJ);
await put(61, 93); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; }); await sleep(1500);
const px = await ev((O) => { const g = globalThis.__edisarG.current; const c = document.querySelector('canvas[data-drop="map"]'); const x2 = c.getContext("2d"); const out = [];
  for (const [x, y] of O) { const [VW] = globalThis.__edisarView(); const k = c.width / VW; const sx = Math.round((x * 32 - g.camX + 2) * k), sy = Math.round((y * 32 - g.camY + 29) * k); const d = x2.getImageData(sx, sy, 1, 1).data; out.push([d[0], d[1], d[2]]); } return out; }, OBJ);
check("bajo los objetos del Bosque Muerto se pinta ceniza (sin verde)", px.every(([r, g2, b]) => g2 < 110 && !(g2 > r + 25 && g2 > b + 25)), JSON.stringify(px));
await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 600; }); await shot("v27-2-ash.png");
// ---------- B) Puertas ----------
const R0 = [30, 80];  // sala 5×5 de muros con una puerta de madera cerrada abajo (32, 84)
await ev(([x0, y0]) => { const g = globalThis.__edisarG.current; const W = 544; for (let y = y0 - 1; y <= y0 + 8; y++) for (let x = x0 - 3; x <= x0 + 7; x++) { g.tiles[y * W + x] = 17; if (g.under) g.under[y * W + x] = 17; }
  for (let y = y0; y <= y0 + 4; y++) for (let x = x0; x <= x0 + 4; x++) if (x === x0 || x === x0 + 4 || y === y0 || y === y0 + 4) g.tiles[y * W + x] = 3;
  g.tiles[(y0 + 4) * W + x0 + 2] = 38; for (const m of g.mons) if (Math.abs(m.x - x0 - 2) < 9 && Math.abs(m.y - y0 - 3) < 9) m.alive = false;
  const m = g.mons.find((q) => q.alive && q.def.id === "troll") || g.mons.find((q) => q.alive && !q.def.boss && q.def.id !== "wknight"); m.x = m.fx = m.sx = x0 + 2; m.y = m.fy = m.sy = y0 + 2; m.moveStart = 0; m.hp = m.def.hp; globalThis.__doorMon = m; }, R0);
const DX = 32, DY = 84; const T = () => ev(([x, y]) => globalThis.__edisarG.current.tiles[y * 544 + x], [DX, DY]);
await put(DX, DY + 1); await key("ArrowUp"); await sleep(300);
check("puerta cerrada: no se pasa con el teclado", JSON.stringify(await at()) === JSON.stringify([DX, DY + 1]) && (await T()) === 38, JSON.stringify(await at()));
const rclick = async (x, y) => { const s = await ev(([x, y]) => { const g = globalThis.__edisarG.current; const [VW, VH] = globalThis.__edisarView(); const c = document.querySelector('canvas[data-drop="map"]'); const r = c.getBoundingClientRect(); return [r.left + ((x * 32 - g.camX) + 16) * r.width / VW, r.top + ((y * 32 - g.camY) + 16) * r.height / VH]; }, [x, y]); await page.mouse.click(s[0], s[1], { button: "right" }); await sleep(250); };
const cm = await ev(() => { const c = document.querySelector('canvas[data-drop="map"]'); const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true }); c.dispatchEvent(e); return e.defaultPrevented; });
check("clic derecho no abre el menú del navegador sobre el juego", cm);
await rclick(DX, DY);
check("clic derecho al lado: la puerta se abre (sprite de puerta abierta)", (await T()) === 39, String(await T()));
await sleep(6000); const mm = await ev(() => { const m = globalThis.__doorMon; return [m.x, m.y, m.alive]; });
check("los monstruos no cruzan puertas abiertas (se quedan en su sala)", mm[0] >= 31 && mm[0] <= 33 && mm[1] >= 81 && mm[1] <= 83, JSON.stringify(mm));
await shot("v27-2-door.png");
await put(DX, DY); await ev(() => { globalThis.__doorMon.alive = false; }); await sleep(1200); await rclick(DX, DY);
check("no se puede cerrar con alguien en la puerta", (await T()) === 39 && /alguien/.test(await status()), await status());
await put(DX, DY + 1); await sleep(1200); await rclick(DX, DY); check("clic derecho otra vez: se cierra", (await T()) === 38);
await put(DX + 5, DY + 4); await rclick(DX, DY); let t1 = Date.now(); while (Date.now() - t1 < 8000 && (await T()) !== 39) await sleep(200);
check("puerta lejos: camina hasta ella y la abre", (await T()) === 39 && Math.max(Math.abs((await at())[0] - DX), Math.abs((await at())[1] - DY)) <= 1, JSON.stringify(await at()));
await put(DX + 1, DY + 1); await rclick(DX, DY); await put(DX + 4, DY + 3);
await ev(([x, y]) => { const g = globalThis.__edisarG.current; g.walkGoal = { x, y, open: false }; }, [DX, DY - 2]); t1 = Date.now(); while (Date.now() - t1 < 8000 && JSON.stringify(await at()) !== JSON.stringify([DX, DY - 2])) await sleep(200);
check("clic para caminar a través de una puerta cerrada: la abre y entra", JSON.stringify(await at()) === JSON.stringify([DX, DY - 2]) && (await T()) === 39, JSON.stringify(await at()));
// ---------- C) NPC de la villa ----------
await newChar("knight", "Caballera", 60);
const np = await ev(() => { const g = globalThis.__edisarG.current; return { tem: [44, 63] }; });
await put(44, 64); await sleep(1200); await shot("v27-2-npcs.png"); await shot("v27-3-town.png");
const npcs = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; const L = globalThis.__edisarNpcs ? globalThis.__edisarNpcs() : []; return L.map(([n, x, y]) => [n, x, y, g.tiles[y * W + x]]); }); console.log("NPC: " + JSON.stringify(npcs));
check("NPC juntos en la plaza, sobre suelo libre (sin estatuas ni objetos)", npcs.length === 8 && npcs.every((q) => [4, 17, 5, 12, 26, 27].includes(q[3])), JSON.stringify(npcs));
const rosa = npcs[0]; await put(rosa[1] + 1, rosa[2] + 1); await sleep(300); await key("t"); await sleep(600);
check("tecla T cerca de Rosa abre la tienda", await ev(() => !!globalThis.__edisarG.current.shopOpen));
// ---------- v27.3: mapa nuevo de Juan Carlos (584×164, ox/oy 10) ----------
const m3 = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; const T = (x, y) => g.tiles[y * W + x];
  return { statues: [T(41, 61), T(55, 61), T(41, 71)], fount: [T(43, 66), T(53, 66)], portal: T(46, 65), tr: T(55, 71), door: T(18, 97), hall: T(82, 94), wk: g.mons.filter((m) => m.def.id === "wknight").length, boris: g.mons.filter((m) => m.def.id === "boris").map((m) => [m.sx, m.sy]) }; });
check("v27.3: estatuas, fuentes, portales, puerta de la torre y sala de Croqui en su sitio (offset 10,10 bien aplicado)", m3.statues.every((t) => t === 57) && m3.fount.every((t) => t === 56) && m3.portal === 11 && m3.tr === 11 && m3.door === 40 && m3.hall === 11 && m3.wk === 10 && JSON.stringify(m3.boris) === "[[8,62]]", JSON.stringify(m3));
await put(20, 97); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; }); await sleep(1200); await rclick(18, 97); await sleep(300);
check("v27.3: la puerta de hierro de la torre se abre con clic derecho", (await ev(() => globalThis.__edisarG.current.tiles[97 * 544 + 18])) === 75);
await ev(() => { const g = globalThis.__edisarG.current; for (const m of g.mons) if ((m.def.id === "wknight" && m.x >= 11 && m.y >= 90) || (m.def.id !== "wknight" && m.def.id !== "boris" && Math.abs(m.x - 19) < 8 && Math.abs(m.y - 97) < 8)) m.alive = false; g.walkGoal = { x: 13, y: 95, open: false }; }); // los White Knight de la entrada atacan y tapan el paso: fuera para la prueba de la puerta
t1 = Date.now(); while (Date.now() - t1 < 9000 && JSON.stringify(await at()) !== "[13,95]") { await ev(() => { globalThis.__edisarG.current.p.hp = 1e6; }); await sleep(200); }
check("v27.3: se entra a la torre por la puerta", JSON.stringify(await at()) === "[13,95]", JSON.stringify(await at()));
await sleep(4000); const wkOut = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; const OUT = new Set([0, 1, 9, 20, 8, 2, 29]); return g.mons.filter((m) => m.alive && (m.def.id === "wknight" || m.def.id === "boris") && (OUT.has(g.tiles[m.y * W + m.x]) || m.x > 18)).map((m) => [m.x, m.y]); });
check("v27.3: con la puerta abierta los White Knight siguen dentro de la torre", wkOut.length === 0, JSON.stringify(wkOut));
await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 600; });
// guardado del mundo de 544×144: la misma casilla del mundo
await page.reload(); await sleep(600); await seed((d) => { d.x = 12; d.y = 95; }); await page.reload(); await sleep(500); await cont(); await sleep(1300);
check("v27.3: un guardado del mapa 544×144 carga en la misma casilla (dentro de la torre)", JSON.stringify(await at()) === "[12,95]" && /White Knight/.test(await ev(() => globalThis.__edisarG.current.zone)), JSON.stringify(await at()) + " " + await ev(() => globalThis.__edisarG.current.zone));
await put(62, 93); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; for (const m of g.mons) if (Math.abs(m.x - 62) < 6 && Math.abs(m.y - 93) < 5) m.alive = false; }); await sleep(1500);
const px3 = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; const c = document.querySelector('canvas[data-drop="map"]'); const x2 = c.getContext("2d"); const [VW] = globalThis.__edisarView(); const k = c.width / VW; const out = [];
  for (let y = 88; y <= 99; y++) for (let x = 56; x <= 69; x++) { const t = g.tiles[y * W + x]; if (t !== 71 && t !== 63) continue; const sx = Math.round((x * 32 - g.camX + 2) * k), sy = Math.round((y * 32 - g.camY + 29) * k); if (sx < 0 || sy < 0 || sx >= c.width || sy >= c.height) continue; const d = x2.getImageData(sx, sy, 1, 1).data; out.push([x, y, t, d[0], d[1], d[2]]); } return out; });
check("v27.3: sus árboles secos y huesos del bosque se ven sobre ceniza (sin verde)", px3.length >= 5 && px3.every((q) => !(q[4] > q[3] + 20 && q[4] > q[5] + 20)), JSON.stringify(px3.filter((q) => q[4] > q[3] + 20 && q[4] > q[5] + 20)) + ` (${px3.length})`);
await ev(() => { globalThis.__edisarG.current.p.hp = 600; }); await shot("v27-3-grove.png");
// ---------- editor ----------
const ed = await browser.newPage(); ed.on("pageerror", (e) => errs.push("editor: " + String(e))); await ed.setViewport({ width: 1366, height: 860 });
await ed.goto("file://" + path.join(G, "dist/editor.html")); await ed.evaluate(() => localStorage.removeItem("edisar.editor.v1")); await ed.reload(); await sleep(900);
const e1 = await ed.evaluate(() => { const E = window.__edisarEditor; const names = window.__ED.tiles.map((t) => t.n); let ash = 0; for (let y = 87; y <= 101; y++) for (let x = 55; x <= 91; x++) if (E.st.floor[(y + E.st.oy) * E.st.w + x + E.st.ox] === 74) ash++; return { ash, has: ["Tierra de ceniza", "Puerta de hierro (abierta)", "Reja (abierta)", "Puerta de madera (cerrada)"].every((n) => names.includes(n)) }; });
check("editor: ceniza en el Bosque Muerto y nuevos tiles en Suelos/Puertas", e1.ash > 100 && e1.has, JSON.stringify(e1));
check("sin errores en la página", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); const ok = res.every(Boolean); console.log(`${res.filter(Boolean).length}/${res.length} v27.2 checks passed`); process.exit(ok ? 0 : 1);
