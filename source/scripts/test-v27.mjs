// v27: más tiles por categorías, lava nueva, mapa agrandable (formato v2 con origen), zona segura pintable. Capturas en shots/v27-*.png.
// Build first: TESTHOOK=1 node scripts/build.mjs (build.sh --test lo hace).
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
// --- A. editor: categorías, agrandar, pintar la villa ---
const ed = await browser.newPage(); ed.on("pageerror", (e) => errs.push("editor: " + String(e))); await ed.setViewport({ width: 1366, height: 860 });
await ed.goto("file://" + path.join(G, "dist/editor.html")); await ed.evaluate(() => localStorage.removeItem("edisar.editor.v1")); await ed.reload(); await sleep(900);
const e1 = await ed.evaluate(() => { const E = window.__edisarEditor; const cats = [...document.querySelectorAll("[data-cat]")].map((b) => b.textContent); const per = {}; for (const b of document.querySelectorAll("[data-tcat]")) per[b.dataset.tcat] = (per[b.dataset.tcat] || 0) + 1; return { cats, per, n: document.querySelectorAll("[data-tile]").length }; });
check("palette has the 7 tabs (Suelos, Muros, Puertas, Muebles, Decoración, Naturaleza, Marcadores)", e1.cats.join("|") === "Suelos|Muros|Puertas|Muebles|Decoración|Naturaleza|Marcadores" && e1.n >= 70, JSON.stringify(e1));
const v1ok = await ed.evaluate(() => { const E = window.__edisarEditor; const t = JSON.parse(E.serialize()); t.v = 1; delete t.ox; delete t.oy; delete t.safe; const r = E.parse(JSON.stringify(t)); return typeof r === "string" ? r : `${r.w}x${r.h}@${r.ox},${r.oy}`; });
check("v1 maps still import", v1ok === "544x144@0,0", v1ok);
const txt = await ed.evaluate((OY) => { const E = window.__edisarEditor;
  E.grow("w", 12); E.grow("n", 6); E.grow("s", 4); const st = E.st; const W = st.w, ox = st.ox, oy = st.oy;
  const F = (x, y, t) => { st.floor[(y + oy) * W + x + ox] = t; }, O = (x, y, t) => { st.obj[(y + oy) * W + x + ox] = t; };
  for (let y = 61; y <= 66; y++) for (let x = 47; x <= 49; x++) F(x, y, 26);            // alfombra roja
  for (let y = 61; y <= 66; y++) F(50, y, 27);                                           // alfombra azul
  O(41, 61, 55); O(55, 61, 55); O(41, 71, 55); O(55, 71, 55); O(47, 61, 59); O(49, 61, 59); // antorchas, columnas
  O(51, 69, 56); O(54, 71, 51); O(55, 70, 51); O(55, 69, 52); O(54, 70, 53);              // fuente, barriles, caja, cofre
  for (let x = 41; x <= 43; x++) F(x, 70, 16); O(41, 69, 50); O(42, 69, 50); O(43, 70, 47); O(42, 70, 48); O(41, 70, 49); // rincón de madera
  O(52, 61, 62); O(45, 69, 57); O(46, 70, 65); O(44, 71, 65); O(52, 71, 66);           // estandarte, estatua, flores, setas
  for (let y = 44; y <= 48; y++) for (let x = 60; x <= 66; x++) F(x, OY + y, 14);       // charco de lava
  O(52, OY + 45, 44); st.marks.push({ k: "portal", x: 52 + ox, y: OY + 45 + oy, tx: -6 + ox, ty: 60 + oy, n: "Bajada" }); // escalera → tierras nuevas (oeste)
  st.marks.push({ k: "spawn", x: -9 + ox, y: 75 + oy, m: "rat" });
  for (let y = 58; y <= 62; y++) for (let x = -8; x <= -4; x++) st.safe[(y + oy) * W + x + ox] = 1;
  st.name = "Prueba v27"; E.dirty(); E.showCat("muebles"); E.setZoom(1); E.centerOn(48 + ox, 66 + oy); return E.serialize(); }, OY);
const meta = JSON.parse(txt);
check("Agrandar mapa: 556×154, origin shifted to 12,6, markers shifted with the map", meta.w === 556 && meta.h === 154 && meta.ox === 12 && meta.oy === 6 && meta.marks[0].x === 64 && meta.v === 2, `${meta.w}x${meta.h} @${meta.ox},${meta.oy} mark ${meta.marks[0].x}`);
await sleep(500); await ed.screenshot({ path: path.join(G, "shots", "v27-editor.png") });
await ed.evaluate((OY) => { const E = window.__edisarEditor; E.showCat("deco"); E.setZoom(2); E.centerOn(63 + 12, OY + 46 + 6); }, OY); await sleep(400); await ed.screenshot({ path: path.join(G, "shots", "v27-editor-lava.png") });
// --- B. game loads it ---
await ed.close(); await page.bringToFront();
await newChar("knight", "Teselas", 30);
await page.evaluate((t) => localStorage.setItem("edisar.map.v1", t), txt); await page.reload(); await sleep(500); await cont(); await sleep(1300);
const g1 = await ev((OY) => { const g = globalThis.__edisarG.current; const W = 544; return { carpet: g.tiles[63 * W + 48], torch: g.tiles[61 * W + 41], lava: g.tiles[(OY + 46) * W + 62], temple: g.tiles[63 * W + 44],
  rat: g.mons.some((m) => m.def.id === "rat" && m.x < 0) }; }, OY);
check("game uses the enlarged map (new tiles in town, original world in place)", g1.carpet === 26 && g1.torch === 55 && g1.lava === 14 && g1.temple === 5, JSON.stringify(g1));
check("spawn marker in the new land adds a monster there", g1.rat);
await put(48, 66); await sleep(1000); await shot("v27-town.png");
await put(63, OY + 42); await sleep(900);
const clip = await page.evaluate(() => { const c = [...document.querySelectorAll("canvas")].sort((a, b) => { const r = (x) => x.getBoundingClientRect().width * x.getBoundingClientRect().height; return r(b) - r(a); })[0].getBoundingClientRect(); return { x: c.x + c.width / 2 - 200, y: c.y + c.height / 2 - 60, width: 400, height: 260 }; });
await page.screenshot({ path: path.join(G, "shots", "v27-lava.png"), clip });
await put(53, OY + 45); await sleep(300); await key("ArrowLeft"); await sleep(600); const p1 = await at();
check("stairs + portal marker take you to the new western land", p1[0] === -6 && p1[1] === 60, JSON.stringify(p1) + " " + await ev(() => globalThis.__edisarG.current.zone));
const z = await ev(() => globalThis.__edisarG.current.zone);
check("zone name in the new land", /Tierras nuevas/.test(z), z);
await ev(() => { const g = globalThis.__edisarG.current; g.walkGoal = { x: -10, y: 66, open: false }; g.chase = false; }); let t0 = Date.now(), arrived = false;
while (!arrived && Date.now() - t0 < 12000) { await sleep(200); const q = await at(); arrived = q[0] === -10 && q[1] === 66; }
check("click-to-walk pathfinding works outside the original world", arrived, JSON.stringify(await at()));
await shot("v27-newland.png");
await page.reload(); await sleep(600); await cont(); await sleep(1200); const p2 = await at();
check("saved position in the new land survives a reload", p2[0] < 0, JSON.stringify(p2));
await page.evaluate(() => localStorage.removeItem("edisar.map.v1")); await page.reload(); await sleep(600); await cont(); await sleep(1200); const p3 = await at();
check("without the map, an out-of-world save position resets safely to the temple", p3[0] === 44 && p3[1] === 63, JSON.stringify(p3));
// Boris, el Caballero Blanco: sprite grande, te atrae a su lado y lanza el exori (tajos rojo / blanco)
const b0 = await ev(() => { const g = globalThis.__edisarG.current; const b = g.mons.find((m) => m.def.id === "boris"); return b ? { x: b.x, y: b.y, s: b.def.look.s, sp: b.def.boss.specials.map((q) => q.kind) } : null; });
check("Boris spawns in the east as a big boss with pull + exori", !!b0 && b0.s > 1.4 && b0.sp.join() === "pull,nova", JSON.stringify(b0));
if (b0) {
  await put(b0.x - 5, b0.y); await ev(() => { const g = globalThis.__edisarG.current; const b = g.mons.find((m) => m.def.id === "boris"); b.angryUntil = performance.now() + 60000; b.spec = [0, performance.now() + 60000]; });
  let pulled = null, warned = false, slashed = false; const t1 = Date.now();
  while (Date.now() - t1 < 9000 && !(pulled && slashed)) {
    const r = await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; const b = g.mons.find((m) => m.def.id === "boris"); return { d: Math.max(Math.abs(b.x - g.p.x), Math.abs(b.y - g.p.y)), w: g.warns.some((w) => w.name === "Exori Gran") }; }).catch(() => null);
    if (r) { if (r.d <= 1 && !pulled) pulled = r; if (r.w) warned = true; else if (warned && !slashed) { slashed = true; await ev(() => { globalThis.__edisarG.current.p.hp = 300; }); await shot("v27-boris.png"); } }
    await sleep(60);
  }
  check("Boris pulls you next to him and casts the exori AoE (red/white slash)", !!pulled && warned && slashed, JSON.stringify({ pulled, warned, slashed }));
  await ev(() => { const g = globalThis.__edisarG.current; const b = g.mons.find((m) => m.def.id === "boris"); b.spec = [performance.now() + 60000, performance.now() + 60000]; g.p.hp = 1e6; }); await sleep(250);
  const clip2 = await page.evaluate(() => { const c = [...document.querySelectorAll("canvas")].sort((a, b) => { const r = (x) => x.getBoundingClientRect().width * x.getBoundingClientRect().height; return r(b) - r(a); })[0].getBoundingClientRect(); return { x: c.x + c.width / 2 - 150, y: c.y + c.height / 2 - 150, width: 300, height: 260 }; });
  await page.screenshot({ path: path.join(G, "shots", "v27-boris-close.png"), clip: clip2 });
}
check("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); const ok = res.every(Boolean); console.log(`${res.filter(Boolean).length}/${res.length} v27 checks passed`); process.exit(ok ? 0 : 1);
