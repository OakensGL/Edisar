// Brujo level-50 summon upgrade (Demonio Infernal): browser check + shots/brujo-demonio.png.
// Build first: TESTHOOK=1 node scripts/build.mjs (build.sh --test does it).
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
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const lvl = (L) => (d, L2) => { d.level = L2; d.exp = Math.round((50 / 3) * (L2 * L2 * L2 - 6 * L2 * L2 + 17 * L2 - 12)); d.hpPot = 500; d.manaPot = 500; delete d.dm; };
await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.select('select[aria-label="Vocación"]', "warlock");
await page.type("input", "Brujo"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
// an open grass patch in the overworld (not town), far from spawns
const spot = async () => ev(() => { const g = globalThis.__edisarG.current; const W = 352, T = g.tiles; const walk = new Set([0, 4, 5, 7, 8, 9, 12]);
  for (let y = 36; y < 140; y++) for (let x = 8; x < 170; x++) { if (x >= 30 && x <= 60 && y >= 50 && y <= 76) continue; let ok = true;
    for (let dy = -3; dy <= 3 && ok; dy++) for (let dx = -3; dx <= 8 && ok; dx++) ok = walk.has(T[(y + dy) * W + x + dx]) && (T[(y + dy) * W + x + dx] === 0);
    if (ok && !g.mons.some((m) => m.alive && Math.max(Math.abs(m.x - x), Math.abs(m.y - y)) <= 10)) return [x, y]; }
  return null; });
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; }, [x, y]);
const sumBtn = () => ev(() => { const g = globalThis.__edisarG.current; const i = g.cls.powers.findIndex((pw) => pw.kind === "summon"); const b = document.querySelector(`[data-pow="${i}"]`); return b ? { i, text: b.textContent, title: b.title } : null; });
const clickSum = (i) => ev((i) => { document.querySelector(`[data-pow="${i}"]`).click(); }, i);
// --- level 49: old summon ---
await seed(lvl(49), 49); await page.reload(); await sleep(600); await cont(); await sleep(1200);
const S = await spot(); check("open overworld spot found", !!S, JSON.stringify(S));
await put(S[0], S[1]); await sleep(300);
const b49 = await sumBtn(); check("level 49: button shows the old summon, tooltip announces level 50", !!b49 && /Invocar/.test(b49.text) && !/Demonio/.test(b49.text) && /nivel 50/.test(b49.title), JSON.stringify(b49));
await clickSum(b49.i); await sleep(500);
const m49 = await ev(() => { const mi = globalThis.__edisarG.current.minion; return mi ? { demon: !!mi.demon } : null; });
check("level 49: summons the old shadow minion", !!m49 && !m49.demon, JSON.stringify(m49));
const n49 = await ev(() => !!globalThis.__edisarG.current.demonSeen); check("level 49: no demon notice", !n49);
// --- existing level-70 save (no dm flag): gets the demon automatically ---
await page.reload(); await sleep(600); await seed(lvl(70), 70); await page.reload(); await sleep(600); await cont(); await sleep(1500);
const nt = await ev(() => { const g = globalThis.__edisarG.current; return { seen: !!g.demonSeen, status: g.status, log: JSON.stringify(g.log.slice(-6)) }; });
check("old level-70 save: one-time «Demonio Infernal» notice", nt.seen && /Demonio Infernal/.test(nt.status + nt.log), nt.status);
await put(S[0], S[1]); await sleep(300);
const b70 = await sumBtn(); check("level 70: button reads «😈 Demonio», tooltip explains the 3×3 area", !!b70 && /Demonio/.test(b70.text) && /3×3/.test(b70.title), JSON.stringify(b70));
// a pack of 5 tough, harmless monsters 3 tiles east
const ids = await ev(([x, y]) => { const g = globalThis.__edisarG.current; const src = g.mons.find((m) => m.alive && m.def.id === "troll") || g.mons.find((m) => m.alive);
  const def = { ...src.def, hp: 200000, atk: 1, speed: 1e9, name: src.def.name }; const out = []; let id = 900000;
  for (const [dx, dy] of [[3, 0], [4, 0], [3, 1], [3, -1], [4, 1]]) { const m = { ...src, id: id, def, hp: def.hp, alive: true, x: x + dx, y: y + dy, fx: x + dx, fy: y + dy, sx: x + dx, sy: y + dy, moveStart: 0, nextMove: 1e15, nextAtk: 0, angryUntil: 0, slowUntil: 0, dotUntil: 0, calmUntil: 0, temp: false };
    g.mons.push(m); (g.byRegion[0] || (g.byRegion[0] = [])).push(m); out.push(id++); }
  g.target = out[0]; return out; }, [S[0], S[1]]);
await clickSum(b70.i); await sleep(300);
const m70 = await ev(() => { const g = globalThis.__edisarG.current; const mi = g.minion; return mi ? { demon: !!mi.demon, min: mi.min, max: mi.max, mhp: mi.mhp } : null; });
check("level 70: summons the Demonio Infernal", !!m70 && m70.demon, JSON.stringify(m70));
let hit = 0, shotDone = false; const t0 = Date.now();
while (Date.now() - t0 < 16000) {
  await ev((ids) => { const g = globalThis.__edisarG.current; g.p.hp = Math.max(g.p.hp, 300); g.target = ids[0]; }, ids); await sleep(150);
  hit = await ev((ids) => globalThis.__edisarG.current.mons.filter((m) => ids.includes(m.id) && m.hp < m.def.hp).length, ids);
  if (hit >= 3 && !shotDone) { await sleep(120); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", "brujo-demonio.png") }); shotDone = true; }
  if (shotDone) break;
}
check("the demon's blast hits several monsters at once (3×3)", hit >= 3, `${hit}/5 damaged`);
check("screenshot shots/brujo-demonio.png", shotDone && fs.existsSync(path.join(G, "shots", "brujo-demonio.png")));
check("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close();
console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
