// v27: White Knight + Torre de Juan Carlos (mapa oficial assets/map.json). Build first: TESTHOOK=1 node scripts/build.mjs
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
check("official map (Juan's tower) loads with 8-12 White Knights and Boris at the top", s0.stone === 17 && s0.wk >= 8 && s0.wk <= 12 && s0.inTower && s0.boris.length === 1 && s0.boris[0][1] <= 64 && s0.look === "wknight", JSON.stringify(s0));
const intr = await ev(() => { const g = globalThis.__edisarG.current; const W = g.tiles.length / 144; return g.mons.filter((m) => m.alive && m.def.id !== "wknight" && m.def.id !== "boris" && m.x >= 2 && m.x <= 18 && m.y >= 60 && m.y <= 101 && (g.tiles[m.y * W + m.x] === 17)).map((m) => [m.def.id, m.x, m.y]); });
check("no other monsters (trolls etc.) spawn inside the tower", intr.length === 0, JSON.stringify(intr));
await put(44, 63); await ev(() => { const g = globalThis.__edisarG.current; g.walkGoal = { x: 20, y: 97, open: false }; g.chase = false; });
let t0 = Date.now(), ok1 = false; while (Date.now() - t0 < 60000) { const r = await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; if (!g.walkGoal && !(g.p.x === 20 && g.p.y === 97)) g.walkGoal = { x: 20, y: 97, open: false }; return [g.p.x, g.p.y]; }); if (r[0] === 20 && r[1] === 97) { ok1 = true; break; } await sleep(250); }
check("the tower is reachable on foot from the temple", ok1, JSON.stringify(await at()) + ` ${Math.round((Date.now() - t0) / 1000)} s`);
await ev(() => { const g = globalThis.__edisarG.current; g.walkGoal = { x: 16, y: 96, open: false }; }); await sleep(2500);
const z = await ev(() => globalThis.__edisarG.current.zone);
check("zone name inside the tower", /White Knight/.test(z), z);
await put(12, 95); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; }); await sleep(1500); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 600; }); await shot("v27-whiteknight.png");
const vis = await ev(() => { const g = globalThis.__edisarG.current; return g.mons.filter((m) => m.alive && m.def.id === "wknight" && Math.abs(m.x - g.p.x) <= 8 && Math.abs(m.y - g.p.y) <= 6).length; });
check("screenshot shows White Knights in the tower", vis >= 3, `${vis} on screen`);
await put(8, 65); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; for (const m of g.mons) if (m.def.id === "boris") m.spec = [performance.now() + 60000, performance.now() + 60000]; }); await sleep(1200); await ev(() => { globalThis.__edisarG.current.p.hp = 600; }); await shot("v27-whiteknight-top.png");
// editor: los dos monstruos son marcadores; los marcadores sustituyen los respawns de fábrica
const ed = await browser.newPage(); ed.on("pageerror", (e) => errs.push("editor: " + String(e))); await ed.setViewport({ width: 1366, height: 860 });
await ed.goto("file://" + path.join(G, "dist/editor.html")); await ed.evaluate(() => localStorage.removeItem("edisar.editor.v1")); await ed.reload(); await sleep(900);
const e1 = await ed.evaluate(() => { const E = window.__edisarEditor; const ids = [...document.querySelectorAll("#mon option")].map((o) => o.value); const OX = E.st.ox || 0, OYf = E.st.oy || 0; const tower = E.st.floor[(62 + OYf) * E.st.w + 8 + OX] === 17 || E.st.obj[(62 + OYf) * E.st.w + 8 + OX] === 17;
  const n = E.wkMarks(); const mk = E.st.marks.filter((m) => m.k === "spawn"); const i = mk.findIndex((m) => m.m === "wknight" && m.x === 15 + OX && m.y === 93 + OYf); if (i >= 0) { mk[i].x = 13 + OX; mk[i].y = 95 + OYf; } E.dirty();
  return { ids: ids.filter((x) => x === "wknight" || x === "boris"), tower, n, moved: i >= 0, txt: E.serialize() }; });
check("editor starts from the official map; White Knight and Boris are selectable markers", e1.tower && e1.ids.length === 2 && e1.n === 11 && e1.moved, JSON.stringify({ ...e1, txt: e1.txt.length }));
await ed.evaluate(() => { window.__edisarEditor.showCat("marks"); window.__edisarEditor.setZoom(1); window.__edisarEditor.centerOn(10, 82); }); await sleep(400); await ed.screenshot({ path: path.join(G, "shots", "v27-editor-wk.png") }); await ed.close(); await page.bringToFront();
await page.evaluate((t) => localStorage.setItem("edisar.map.v1", t), e1.txt); await page.reload(); await sleep(500); await cont(); await sleep(1300);
const s1 = await ev(() => { const g = globalThis.__edisarG.current; const wk = g.mons.filter((m) => m.def.id === "wknight"); return { n: wk.length, moved: wk.some((m) => m.sx === 13 && m.sy === 95), old: wk.some((m) => m.sx === 15 && m.sy === 93), boris: g.mons.filter((m) => m.def.id === "boris").length }; });
check("the game honours the editor markers (moved respawn, no duplicates)", s1.n === 10 && s1.moved && !s1.old && s1.boris === 1, JSON.stringify(s1));
check("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); const okAll = res.every(Boolean); console.log(`${res.filter(Boolean).length}/${res.length} White Knight checks passed`); process.exit(okAll ? 0 : 1);
