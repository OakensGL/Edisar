// v26: tiles 32×32 (DCSS CC0), editor de mapas (dist/editor.html) + carga de mapas en el juego, Torre de Croqui más al sur. Capturas en shots/.
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
// --- A. editor ---
const ed = await browser.newPage(); ed.on("pageerror", (e) => errs.push("editor: " + String(e))); await ed.setViewport({ width: 1366, height: 860 });
await ed.goto("file://" + path.join(G, "dist/editor.html")); await ed.evaluate(() => localStorage.removeItem("edisar.editor.v1")); await ed.reload(); await sleep(900);
const e1 = await ed.evaluate(() => ({ ok: !!window.__edisarEditor, pal: document.querySelectorAll("[data-tile]").length, w: window.__ED.W, h: window.__ED.H, zones: document.querySelectorAll("#zone option").length }));
check("editor loads with the full tile palette", e1.ok && e1.pal === 21 && e1.w === 544 && e1.h === 144, JSON.stringify(e1));
const txt = await ed.evaluate((OY) => { const E = window.__edisarEditor; const st = E.st; const W = 544;
  for (let y = OY + 44; y <= OY + 46; y++) for (let x = 51; x <= 53; x++) st.floor[y * W + x] = 15; // nieve
  st.obj[(OY + 44) * W + 55] = 20; // arbusto
  st.marks.push({ k: "spawn", x: 52, y: OY + 50, m: "rat" }, { k: "portal", x: 50, y: OY + 45, tx: 44, ty: OY + 31, n: "Prueba" }, { k: "npc", x: 53, y: OY + 47, n: "Vecina" }); st.obj[(OY + 45) * W + 50] = 11;
  st.name = "Prueba v26"; E.dirty(); return E.serialize(); }, OY);
const rt = await ed.evaluate((t) => { const r = window.__edisarEditor.parse(t); return typeof r === "string" ? r : JSON.stringify({ format: "edisar-map", v: 1, name: r.name, w: 544, h: 144 }) && r.marks.length; }, txt);
check("export → import round trip keeps the layers and markers", rt === 3, String(rt));
await ed.evaluate(() => { const E = window.__edisarEditor; E.setZoom(1); E.centerOn(48, 32 + 40); }); await sleep(500); await ed.screenshot({ path: path.join(G, "shots", "v26-editor.png") });
await sleep(800); const saved = await ed.evaluate(() => (localStorage.getItem("edisar.editor.v1") || "").length);
check("editor autosaves to localStorage", saved > 1000, `${saved} B`);
// --- B. game: tiles, town + hunt screenshots ---
await ed.close(); await page.bringToFront();
await newChar("knight", "Teselas", 30);
const colors = async () => ev(() => { const ar = (c) => { const r = c.getBoundingClientRect(); return r.width * r.height; }; let best = 0; for (const c of document.querySelectorAll("canvas")) { if (!c.width) continue; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; const s = new Set(); for (let i = 0; i < d.length; i += 16) s.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); best = Math.max(best, s.size); } return best; });
await put(48, OY + 34); await sleep(900); const nc = await colors(); await shot("v26-town.png");
check("town is drawn with the textured 32×32 tileset", nc > 2500, `${nc} colours`);
await put(76, OY + 15); await sleep(900); await shot("v26-hunt.png");
const cq = await ev(() => { const g = globalThis.__edisarG.current; const W = 544; return [g.tiles[94 * W + 82], g.tiles[80 * W + 65], g.tiles[94 * W + 70]]; });
check("Croqui tower moved south: teleport at 82,94, old spot is plain ground", cq[0] === 11 && cq[1] !== 11 && cq[2] === 4, JSON.stringify(cq));
// --- C. game loads the editor map ---
await page.evaluate((t) => localStorage.setItem("edisar.map.v1", t), txt); await page.reload(); await sleep(500); await cont(); await sleep(1300);
const m1 = await ev((OY) => { const g = globalThis.__edisarG.current; const W = 544; return { snow: g.tiles[(OY + 45) * W + 52], bush: g.tiles[(OY + 44) * W + 55], under: g.under ? g.under[(OY + 44) * W + 55] : -1,
  rat: g.mons.some((m) => m.def.id === "rat" && Math.abs(m.x - 52) <= 6 && Math.abs(m.y - (OY + 50)) <= 6) }; }, OY);
check("game applies the loaded map (floor + object layers)", m1.snow === 15 && m1.bush === 20 && m1.under === 0, JSON.stringify(m1));
check("spawn marker adds a monster", m1.rat);
await put(51, OY + 45); await sleep(300); await key("ArrowLeft"); await sleep(500); const pp = await at();
check("portal marker teleports to its target (temple)", Math.abs(pp[0] - 44) <= 1 && Math.abs(pp[1] - (OY + 31)) <= 1, JSON.stringify(pp));
await page.evaluate(() => localStorage.removeItem("edisar.map.v1"));
check("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); const ok = res.every(Boolean); console.log(`${res.filter(Boolean).length}/${res.length} v26 checks passed`); process.exit(ok ? 0 : 1);
