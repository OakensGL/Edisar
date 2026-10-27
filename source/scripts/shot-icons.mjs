// Screenshots of the pixel-art item icons: shots/icons-backpack.png, icons-shop.png, icons-shop-sell.png, icons-depot.png, icons-tooltip.png, icons-floor.png
import puppeteer from "puppeteer-core"; import path from "node:path";
import { activeShim } from "./active-shim.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 1000 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Herrero"); await page.select('select[aria-label="Vocación"]', "knight"); await page.evaluate(() => document.querySelector("[data-create]").click()); await sleep(1200);
await page.reload(); await sleep(500);
const BAG = [["swd4", "com"], ["bow4", "rar"], ["stf4", "epi"], ["gemini_gold", "hea"], ["swd_t5", "hea"], ["hdp_t4", "epi"], ["bdp_t3", "rar"], ["shd4", "epi"], ["orb3", "rar"], ["ft_t5", "hea"],
  ["am1", "com"], ["rg_t5", "hea"], ["axe3", "rar"], ["dag4", "epi"], ["lgc_t2", "rar"], ["hd5", "com"], ["bd6", "epi"], ["qv_t4", "rar"], ["wand_t3", "epi"], ["clb_t1", "com"]];
const DEP = [["rod_t5", "hea"], ["hdc_t5", "hea"], ["bdc_t4", "epi"], ["lgp_t5", "hea"], ["am_t3", "rar"], ["ldg_t2", "rar"], ["ft3", "epi"], ["rg2", "rar"], ["bd5", "com"], ["shd_t5", "hea"], ["swd_t1", "com"], ["bow_t3", "epi"]];
await page.evaluate((BAG, DEP) => {
  const k = "@active"; const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  let u = d.nextUid; d.bag = BAG.map(([id, rar]) => ({ uid: u++, id, rar })); d.dep = DEP.map(([id, rar]) => ({ uid: u++, id, rar })); d.nextUid = u; d.gold = 50000; d.exp = 4000000;
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, BAG, DEP);
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1300);
const imgs = (sel) => page.evaluate((s) => [...document.querySelectorAll(`${s} img`)].filter((i) => i.src.startsWith("data:image/png") && i.naturalWidth === 32).length, sel);
const bagSel = '[data-drop^="bag:"]';
check("backpack cells show pixel icons", (await imgs(bagSel)) >= 20, String(await imgs(bagSel)));
check("paper-doll shows pixel icons", (await page.evaluate(() => [...document.querySelectorAll('[data-drop^="eq:"] img')].length)) >= 4);
// backpack (scroll the side panel to it)
await page.evaluate(() => document.querySelector('[data-drop="bag:0"]').scrollIntoView({ block: "center" })); await sleep(300);
const panel = await page.evaluate(() => { const a = document.querySelector('[data-drop="bag:0"]').closest("div").parentElement.getBoundingClientRect(); const cells = [...document.querySelectorAll('[data-drop^="bag:"]')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
  const x0 = Math.min(...cells.map((r) => r.left)), y0 = Math.min(...cells.map((r) => r.top)), x1 = Math.max(...cells.map((r) => r.right)), y1 = Math.max(...cells.map((r) => r.bottom)); return { x: x0 - 8, y: y0 - 30, w: x1 - x0 + 16, h: y1 - y0 + 38 }; });
await page.screenshot({ path: path.join(root, "shots/icons-backpack.png"), clip: { x: Math.max(0, panel.x), y: Math.max(0, panel.y), width: panel.w, height: panel.h, scale: 2 } });
// tooltip on a Heaven item (bag:3 = Armadura de Géminis)
const cell = await page.$('[data-drop="bag:3"]'); const b = await cell.boundingBox();
await page.mouse.move(b.x + 4, b.y + 4); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await sleep(500);
const tipImgs = await page.evaluate(() => [...document.querySelectorAll("img")].filter((i) => i.width === 32 && getComputedStyle(i.parentElement).display === "flex" && i.parentElement.textContent.length > 3).length);
check("tooltip shows the framed icon next to the name", tipImgs >= 1);
await page.screenshot({ path: path.join(root, "shots/icons-tooltip.png") });
await page.mouse.move(5, 5); await sleep(300);
// floor + power bar
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300);
// depot
await page.evaluate(() => document.querySelector("[data-depbtn]").click()); let ok = false; for (let i = 0; i < 60 && !ok; i++) { await sleep(150); ok = await page.evaluate(() => !!document.querySelector("[data-depot]")); }
check("depot opens with icons", ok && (await imgs("[data-depot]")) >= 12, String(await imgs("[data-depot]")));
await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.move(5, 5); await sleep(300);
const dep = await page.$("[data-depot]"); await dep.screenshot({ path: path.join(root, "shots/icons-depot.png") });
await page.keyboard.press("Escape"); await sleep(300);
// shop (Rosa)
await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.includes("🛒 Tienda")).click());
ok = false; for (let i = 0; i < 80 && !ok; i++) { await sleep(150); ok = await page.evaluate(() => [...document.querySelectorAll("button")].some((x) => /^Vender \(\d+\)$/.test(x.textContent.trim()))); }
const shopImgs = await page.evaluate(() => document.querySelectorAll("img").length);
check("shop opens with item + potion icons", ok && shopImgs > 40, String(shopImgs));
await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.move(5, 5); await sleep(300);
const shopBox = await page.evaluate(() => { const h = [...document.querySelectorAll("div,span,b")].find((e) => e.textContent.trim() === "🛒 Tienda de Rosa"); let el = h; while (el && el.getBoundingClientRect().height < 300) el = el.parentElement; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + window.scrollY, width: r.width, height: Math.min(r.height, 640) }; });
await page.screenshot({ path: path.join(root, "shots/icons-shop.png"), clip: shopBox });
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /^Vender \(\d+\)$/.test(x.textContent.trim())); if (b) b.click(); }); await sleep(300);
check("sell tab shows framed rarity icons", (await page.evaluate(() => [...document.querySelectorAll("button")].filter((x) => x.textContent.trim() === "Vender").length)) >= 20);
await page.screenshot({ path: path.join(root, "shots/icons-shop-sell.png"), clip: shopBox });
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
