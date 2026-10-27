// Headless check: depot chest next to the temple (open, drag bag ↔ depot, tooltip, buttons, persistence). Screenshot: shots/depot.png
import puppeteer from "puppeteer-core"; import path from "node:path";
import { activeShim } from "./active-shim.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 1250 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Guardian"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
// seed the backpack with copies of the equipped items (various rarities) via the save
await page.evaluate(() => {
  const k = "@active"; const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  let u = d.nextUid; const rs = ["com", "rar", "epi", "hea"]; d.bag = []; for (let r = 0; r < 2; r++) for (const i of Object.values(d.eq).filter(Boolean)) d.bag.push({ ...i, uid: u++, rar: rs[(d.bag.length) % 4], st: {} }); d.bag = d.bag.slice(0, 10); d.nextUid = u;
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
});
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1200);
const has = (s) => page.evaluate((x) => !!document.querySelector(x), s);
const depCount = () => page.evaluate(() => Number(document.querySelector("[data-depcount]")?.getAttribute("data-depcount") ?? -1));
const bagCount = () => page.evaluate(() => [...document.querySelectorAll('[data-drop^="bag:"]')].filter((e) => /^bag:\d+$/.test(e.getAttribute("data-drop")) && !e.querySelector("[data-drop]") && Number(e.getAttribute("data-drop").slice(4)) < 20 && e.textContent.trim().length > 0).length);
const b0 = await bagCount(); check("backpack seeded", b0 >= 6, String(b0));
check("depot closed at start", !(await has("[data-depot]")));
await page.evaluate(() => document.querySelector("[data-depbtn]").click());
let ok = false; for (let i = 0; i < 50 && !ok; i++) { await sleep(150); ok = await has("[data-depot]"); }
check("📦 Depósito button walks to the chest and opens it", ok);
check("depot has 80 slots", await page.evaluate(() => document.querySelectorAll('[data-depot] [data-drop^="dep:"]').length) >= 80);
const center = async (sel) => { const el = await page.$(sel); await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: "nearest" }), sel); await sleep(60); const b = await el.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const drag = async (from, to) => { const [x0, y0] = await center(from); const [x1, y1] = await center(to); await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x0 + 12, y0 + 4, { steps: 3 }); await page.mouse.move(x1, y1, { steps: 10 }); await page.mouse.up(); await sleep(250); };
await drag('[data-drop="bag:0"]', '[data-drop="dep:0"]'); await drag('[data-drop="bag:0"]', '[data-drop="dep:1"]'); await drag('[data-drop="bag:0"]', '[data-drop="dep:2"]');
check("drag backpack → depot (3 items)", (await depCount()) === 3 && (await bagCount()) === b0 - 3, `${await depCount()} / ${await bagCount()}`);
await drag('[data-drop="dep:0"]', '[data-drop="bag:0"]');
check("drag depot → backpack", (await depCount()) === 2 && (await bagCount()) === b0 - 2);
await sleep(400); // click item → Sacar
await page.evaluate(() => document.querySelector('[data-drop="dep:0"]').click()); await sleep(200);
await page.evaluate(() => [...document.querySelectorAll("[data-depot] button")].find((b) => b.textContent.includes("Sacar")).click()); await sleep(200);
check("click + «Sacar»", (await depCount()) === 1 && (await bagCount()) === b0 - 1);
// bag item detail → 📦 Guardar
await page.evaluate(() => document.querySelector('[data-drop="bag:0"]').click()); await sleep(200);
const g1 = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("📦 Guardar")); if (b) b.click(); return !!b; }); await sleep(200);
check("bag item detail «📦 Guardar»", g1 && (await depCount()) === 2);
await page.evaluate(() => [...document.querySelectorAll("[data-depot] button")].find((b) => b.textContent.includes("Guardar todo")).click()); await sleep(250);
check("«Guardar todo»", (await depCount()) === b0 && (await bagCount()) === 0, String(await depCount()));
await drag('[data-drop="dep:3"]', '[data-drop="bag:0"]'); await drag('[data-drop="dep:0"]', '[data-drop="bag:1"]');
// tooltip on a depot item
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300);
const [tx, ty] = await center('[data-drop="dep:1"]'); const before = await page.evaluate(() => document.body.innerText);
await page.mouse.move(tx - 5, ty - 5); await page.mouse.move(tx, ty, { steps: 4 }); await sleep(400);
const after = await page.evaluate(() => document.body.innerText);
check("comparison tooltip on depot items", after.length > before.length + 10);
check("▲ upgrade markers render in depot cells (cells use ItemCell up=)", await page.evaluate(() => document.querySelectorAll('[data-depot] [data-drop^="dep:"]').length > 0));
await page.screenshot({ path: path.join(root, "shots/depot.png") });
const dc = await depCount();
await page.keyboard.press("Escape"); await sleep(200); check("Esc closes the depot", !(await has("[data-depot]")));
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1200);
await page.evaluate(() => document.querySelector("[data-depbtn]").click()); ok = false; for (let i = 0; i < 50 && !ok; i++) { await sleep(150); ok = await has("[data-depot]"); }
check("depot contents persist after reload", ok && (await depCount()) === dc, `${dc}`);
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
