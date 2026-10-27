// Headless check: Géminis rework — Kanon joins at 50% of Saga, «Otra Dimensión» (purple transition, void arena, ??? minimap), return, debuff icons.
// Screenshots: shots/otra-dimension.png, shots/otra-dimension-arena.png, shots/gemini-fight.png
import puppeteer from "puppeteer-core"; import path from "node:path";
import { activeShim } from "./active-shim.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const K = "@active"; const LV = Number(process.env.LV ?? 260), ML = Number(process.env.ML ?? 160);
const seed = (fn, arg) => page.evaluate((k, src, a) => {
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  (0, eval)(src)(d, a);
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K, fn.toString(), arg);
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const zone = () => page.evaluate(() => [...document.querySelectorAll("span[title]")].map((s) => s.getAttribute("title")).find((t) => /Casa|Templo|Dimensi|Villa|Santuario|Edisar/.test(t || "")) || "");
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(root, f) }); };
const purple = () => page.evaluate(() => { const cv = document.querySelector('canvas[data-drop="map"]'); const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return [r / n, g / n, b / n]; });
await page.goto("file://" + path.join(root, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.select('select[aria-label="Vocación"]', "sorc");
await page.type("input", "Shiryu"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
await seed((d, a) => { const L = a.LV; d.level = L; d.exp = Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12)); d.sk.magic.lvl = a.ML; d.hp = 1e6; d.mana = 1e6; d.hpPot = 500; d.manaPot = 500; d.hpPot2 = 500; d.manaPot2 = 500; d.cleared = 12; d.quests[11].e = true; d.x = 339; d.y = 104; }, { LV, ML });
await page.reload(); await sleep(600); await cont(); await sleep(1500);
check("starts in the Gemini temple", /Templo de Saga|Géminis/.test(await zone()), await zone());
await shot("shots/gemini-start.png");
// fight a bit for real, then bring Saga to 49% through the test hook (Kanon joins at 50%)
for (let i = 0; i < 4; i++) { await page.keyboard.press("Space"); await page.keyboard.press("Digit2"); await sleep(300); }
const sagaHp = () => page.evaluate(() => { const g = globalThis.__edisarG.current; const s = g.byRegion[12].find((m) => m.def.id === "h12boss" && m.alive); return s ? [s.hp, s.def.hp] : null; });
check("Saga alone at the start (no Kanon yet)", await page.evaluate(() => !globalThis.__edisarG.current.byRegion[12].some((m) => m.alive && m.def.id === "h12boss2")));
await page.evaluate(() => { const g = globalThis.__edisarG.current; const s = g.byRegion[12].find((m) => m.def.id === "h12boss" && m.alive); s.hp = Math.round(s.def.hp * 0.49); });
await sleep(400);
check("at 50% Kanon joins", await page.evaluate(() => globalThis.__edisarG.current.byRegion[12].some((m) => m.alive && m.def.id === "h12boss2")), JSON.stringify(await sagaHp()));
let inDim = false; const t0 = Date.now();
while (!inDim && Date.now() - t0 < 5000) { await sleep(60); inDim = (await zone()).includes("Otra Dimensi"); }
check("Kanon's «Otra Dimensión» sends you to the void arena", inDim, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (inDim) {
  await sleep(250); await shot("shots/otra-dimension.png");
  const c = await purple(); check("screen tinted deep purple during the transition", c[2] > c[1] * 1.3 && c[0] > c[1], c.map(Math.round).join(","));
  await sleep(2600); await shot("shots/otra-dimension-arena.png");
  const c2 = await purple(); check("void arena stays purple", c2[2] > c2[1] * 1.2, c2.map(Math.round).join(","));
  const mini = await page.evaluate(() => { const cv = document.querySelector("[data-minizoom] canvas"); const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let b = 0, n = 0; for (let i = 0; i < d.length; i += 40) { if (d[i + 2] > d[i + 1] + 25) b++; n++; } return b / n; });
  check("minimap shows the purple ??? void", mini > 0.3, mini.toFixed(2));
  // walk back through the rift or wait it out
  await page.evaluate(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; }); let back = false; const t1 = Date.now();
  while (!back && Date.now() - t1 < 40000) { await page.evaluate(() => { const g = globalThis.__edisarG.current; g.p.hp = Math.max(g.p.hp, 900); }); await sleep(250); back = !(await zone()).includes("Otra Dimensi"); }
  check("you come back to the Gemini room (≤ 25 s + margin)", back && /Géminis|Saga/.test(await zone()), await zone());
  await sleep(500);
  check("both twins alive back in the room", await page.evaluate(() => globalThis.__edisarG.current.byRegion[12].filter((m) => m.alive && (m.def.id === "h12boss" || m.def.id === "h12boss2")).length === 2));
  // wait for a telegraphed Explosión de Galaxias and capture the two-boss fight
  let gal = false; const t2 = Date.now();
  while (!gal && Date.now() - t2 < 30000) { await page.keyboard.press("Space"); await page.keyboard.press("Digit1"); await sleep(150); await page.evaluate(() => { const g = globalThis.__edisarG.current; g.p.hp = Math.max(g.p.hp, 900); }); gal = await page.evaluate(() => globalThis.__edisarG.current.warns.some((w) => w.name === "Explosión de Galaxias" && w.at - performance.now() < 1300)); }
  check("Explosión de Galaxias is telegraphed (big warned area)", gal && await page.evaluate(() => globalThis.__edisarG.current.warns.some((w) => w.name === "Explosión de Galaxias" && w.cells.length >= 25)));
  await page.evaluate(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[12].find((x) => x.alive && x.def.id === "h12boss2"); const now = performance.now(); if (m) { m.dotUntil = now + 8000; m.dotNext = now + 1000; m.dotMin = 1; m.dotMax = 2; m.slowUntil = now + 4000; } });
  await shot("shots/gemini-fight.png");
}
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
const n = res.filter(Boolean).length; console.log(`${n}/${res.length} passed`); await browser.close(); process.exit(n === res.length ? 0 : 1);
