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
// v27.1: White Knight a tamaño normal (una casilla de 32 px) y vida/nombre encima de la cabeza (también Boris y otros sprites altos)
await newChar("knight", "Caballera", 55);
const r = await ev(() => { const g = globalThis.__edisarG.current; const F = globalThis.__edisarMonTop; const seen = {}; for (const m of g.mons) if (!seen[m.def.id]) { const t = F(m); seen[m.def.id] = { n: m.def.name, top: t, bar: Math.max(-40, Math.min(-4, t - 6)), s: m.def.look ? m.def.look.s : 1 }; } return seen; });
const wk = r.wknight, bo = r.boris;
check("White Knight cabe en una casilla (escala 0.88, cabeza dentro de la casilla)", wk && wk.s <= 1 && wk.top >= -2, JSON.stringify(wk));
check("vida/nombre del White Knight por encima de la cabeza", wk && wk.bar + 4 <= wk.top, JSON.stringify(wk));
check("Boris sigue grande y su barra va por encima de la cabeza", bo && bo.s > 1.4 && bo.top < -10 && bo.bar + 4 <= bo.top, JSON.stringify(bo));
const bad = Object.entries(r).filter(([, v]) => v.bar + 4 > v.top && v.top > -36); check("ningún monstruo con la barra sobre la cara", bad.length === 0, JSON.stringify(bad));
const moved = Object.entries(r).filter(([, v]) => v.bar < -4).map(([k, v]) => `${v.n} (${v.top})`); console.log("barra subida para: " + moved.join(", "));
await put(12, 95); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; }); await sleep(1500); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 600; }); await shot("v27-1-whiteknight.png");
await put(8, 65); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; for (const m of g.mons) if (m.def.id === "boris") m.spec = [performance.now() + 60000, performance.now() + 60000]; }); await sleep(1500); await shot("v27-1-boris.png");
check("sin errores en la página", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); const ok = res.every(Boolean); console.log(`${res.filter(Boolean).length}/${res.length} v27.1 checks passed`); process.exit(ok ? 0 : 1);
