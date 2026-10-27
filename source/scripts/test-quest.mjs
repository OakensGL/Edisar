// Headless check: town quest NPCs (dialog, accept, J quest log, HUD tracker, persistence) + buff bar (XP potion / Premium countdown).
// Screenshots: shots/quest-dialog.png, shots/quest-log.png
import puppeteer from "puppeteer-core"; import path from "node:path";
import { activeShim } from "./active-shim.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const K = "@active";
const readSave = () => page.evaluate((k) => { const c = localStorage.getItem(k); return c ? JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0)))) : null; }, K);
const seed = (fn) => page.evaluate((k, src) => {
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  (0, eval)(src)(d);
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K, fn.toString());
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const has = (s) => page.evaluate((x) => !!document.querySelector(x), s);
const txt = (s) => page.evaluate((x) => document.querySelector(x)?.textContent ?? "", s);
const attr = (s, a) => page.evaluate((x, y) => document.querySelector(x)?.getAttribute(y) ?? null, s, a);
const click = (s) => page.evaluate((x) => document.querySelector(x).click(), s);
const waitFor = async (s, n = 60) => { for (let i = 0; i < n; i++) { if (await has(s)) return true; await sleep(150); } return false; };
const mmss = (t) => { const m = /(\d+):(\d\d)/.exec(t || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
// find an NPC on the map canvas by its exact robe colour and return the css point
const findColor = (hex) => page.evaluate((hx) => {
  const cv = document.querySelector('canvas[data-drop="map"]'); const ctx = cv.getContext("2d"); const r = cv.getBoundingClientRect();
  const R = parseInt(hx.slice(1, 3), 16), G = parseInt(hx.slice(3, 5), 16), B = parseInt(hx.slice(5, 7), 16);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data; const xs = [], ys = [];
  for (let i = 0; i < d.length; i += 4) if (d[i] === R && d[i + 1] === G && d[i + 2] === B) { const p = i / 4; xs.push(p % cv.width); ys.push(Math.floor(p / cv.width)); }
  if (xs.length < 6) return null; xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  const mx = xs[xs.length >> 1], my = ys[ys.length >> 1];
  return [r.left + (mx * r.width) / cv.width, r.top + (my * r.height) / cv.height, xs.length];
}, hex);

await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Pegaso"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
const s0 = await readSave(); check("old-style save has no quests", s0 && s0.nq === undefined);
await seed((d) => { d.cs = { ...(d.cs || {}), xpLeft: 3600000, premUntil: Date.now() + 30 * 86400000 - 60000 }; });
await page.reload(); await sleep(600); await cont(); await sleep(1200);
// buff bar
check("buff bar shows the XP potion and Premium", (await has('[data-buff="xp"]')) && (await has('[data-buff="prem"]')));
const x0 = mmss(await txt('[data-buff="xp"] [data-bufftxt]'));
check("XP potion as mm:ss (≈60:00)", x0 >= 3590 && x0 <= 3600, await txt('[data-buff="xp"]'));
check("Premium as days/hours", /29d 23h/.test(await txt('[data-buff="prem"]')), await txt('[data-buff="prem"]'));
check("tooltips describe the effect", ((await attr('[data-buff="xp"]', "title")) || "").includes("+50%") && ((await attr('[data-buff="prem"]', "title")) || "").includes("+10%"));
await sleep(3200); const x1 = mmss(await txt('[data-buff="xp"] [data-bufftxt]'));
check("XP countdown ticks while playing", x1 > 0 && x1 <= x0 - 2 && x1 >= x0 - 5, `${x0} → ${x1}`);
// NPC marks and dialog
check("no quest tracker before accepting", !(await has("[data-qtrack]")));
const kiki = await findColor("#a8603a"); check("Kiki is drawn on screen (not under the HUD)", !!kiki, JSON.stringify(kiki));
if (kiki) { await page.mouse.click(kiki[0], kiki[1]); }
check("clicking Kiki opens the dialog", await waitFor('[data-dialog="kiki"]', 40));
check("dialog shows replies misión/diario/adiós", (await has('[data-reply="mision"]')) && (await has('[data-reply="adios"]')) && !(await has('[data-reply="aceptar"]')));
await click('[data-reply="mision"]'); await sleep(250);
check("«misión» offers a quest with rewards and «aceptar»", (await txt("[data-say]")).includes("Premio") && (await has('[data-reply="aceptar"]')), (await txt("[data-say]")).slice(0, 80));
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await page.screenshot({ path: path.join(root, "shots/quest-dialog.png") });
await click('[data-reply="aceptar"]'); await sleep(250);
check("«aceptar» starts the quest; tracker shows 0/10", (await has("[data-qtrack]")) && (await txt("[data-qtrack]")).includes("0/10"));
await click('[data-reply="adios"]'); await sleep(200); check("«adiós» closes the dialog", !(await has("[data-dialog]")));
// quest log
await page.keyboard.press("KeyJ"); await sleep(250);
check("J opens the quest log", await has("[data-qlog]"));
check("log lists k1 as active with progress", (await attr('[data-quest="k1"]', "data-qstate")) === "active" && (await has('[data-quest="k1"] [data-qprog="0/10"]')));
check("log shows in-progress and locked groups", (await txt("[data-qlog]")).includes("En curso") && (await txt("[data-qlog]")).includes("Bloqueadas"));
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await page.screenshot({ path: path.join(root, "shots/quest-log.png") });
await page.keyboard.press("KeyJ"); await sleep(200); check("J closes it", !(await has("[data-qlog]")));
await click("[data-qlogbtn]"); await sleep(200); check("🗒️ Diario button opens it", await has("[data-qlog]"));
await page.keyboard.press("Escape"); await sleep(200); check("Esc closes it", !(await has("[data-qlog]")));
await page.keyboard.press("KeyH"); await sleep(250);
check("Atajos lists «Diario de misiones»", await page.evaluate(() => document.body.innerText.includes("Diario de misiones")));
await page.keyboard.press("KeyH"); await sleep(150);
// persistence
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "💾 Guardar")?.click()); await sleep(400);
await page.keyboard.press("Escape"); await sleep(200);
const xs = mmss(await txt('[data-buff="xp"] [data-bufftxt]'));
await page.reload(); await sleep(2500); await cont(); await sleep(1200);
const s1 = await readSave();
check("save has the quest", s1 && s1.nq && s1.nq.k1 && s1.nq.k1.s === "a", JSON.stringify(s1 && s1.nq));
check("after reload: tracker still there", (await txt("[data-qtrack]")).includes("0/10"));
const x2 = mmss(await txt('[data-buff="xp"] [data-bufftxt]'));
check("after reload: XP timer kept (closed time not spent)", x2 > 0 && x2 >= xs - 4 && x2 <= xs, `${xs} → ${x2}`);
// expiry messages
await page.reload(); await sleep(600);
await seed((d) => { d.cs.premUntil = Date.now() - 5000; d.cs.xpLeft = 2000; });
await page.reload(); await sleep(600); await cont(); await sleep(800);
check("expired Premium: not shown", !(await has('[data-buff="prem"]')));
await sleep(3000);
check("XP potion runs out: icon gone", !(await has('[data-buff="xp"]')));
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("📖 Registro"))?.click()); await sleep(300);
const logTxt = await page.evaluate(() => document.body.innerText);
check("expiry messages in the log (Premium + potion)", logTxt.includes("Tu Premium terminó") && logTxt.includes("Se acabó la poción de experiencia"));
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "💾 Guardar")?.click()); await sleep(400); await page.keyboard.press("Escape"); await sleep(200);
const s2 = await readSave(); check("expired Premium cleared in the save", s2 && s2.cs && s2.cs.premUntil === 0 && s2.cs.xpLeft === 0, JSON.stringify(s2 && s2.cs && [s2.cs.premUntil, s2.cs.xpLeft]));
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
const n = res.filter(Boolean).length; console.log(`${n}/${res.length} passed`); await browser.close(); process.exit(n === res.length ? 0 : 1);
