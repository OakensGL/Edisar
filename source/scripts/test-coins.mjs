// Headless check: Edisar Coins store (K / HUD button), Cambista Darío exchange, AFK loot filter, persistence. Screenshots: shots/coin-store.png, shots/coin-exchange.png
import puppeteer from "puppeteer-core"; import path from "node:path";
import { activeShim } from "./active-shim.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Cambista"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
const attr = (sel, a) => page.evaluate((s, k) => document.querySelector(s)?.getAttribute(k) ?? null, sel, a);
const has = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
const clickIn = (sel, txt) => page.evaluate((s, t) => { const b = [...document.querySelectorAll(`${s} button`)].find((x) => x.textContent.includes(t)); if (b) b.click(); return !!b; }, sel, txt);
check("HUD shows 0 coins next to gold", (await attr("[data-coins]", "data-coins")) === "0");
await page.keyboard.press("KeyK"); await sleep(300); check("K opens the coin store", await has("[data-coinstore]"));
check("store shows the test-store note", await page.evaluate(() => document.querySelector("[data-coinstore]").innerText.includes("Tienda de prueba: en la versión online se comprarán con dinero real")));
check("store has no inputs for payment / no links", await page.evaluate(() => { const s = document.querySelector("[data-coinstore]"); return s.querySelectorAll("a, form, input[type=password], input[autocomplete^=cc]").length === 0; }));
await page.keyboard.press("Escape"); await sleep(250); check("Esc closes it", !(await has("[data-coinstore]")));
await page.evaluate(() => document.querySelector("[data-coinbtn]").click()); await sleep(250); check("HUD 🪙 Coins button opens it", await has("[data-coinstore]"));
await clickIn("[data-coinstore]", "Modo prueba"); await sleep(250);
check("Modo prueba: +100 coins", (await attr("[data-coinbal]", "data-coinbal")) === "100" && (await attr("[data-coins]", "data-coins")) === "100");
await clickIn('[data-coinitem="o_carmesi"]', "Comprar"); await sleep(250);
check("buying an outfit deducts 40", (await attr("[data-coinbal]", "data-coinbal")) === "60" && await page.evaluate(() => document.querySelector('[data-coinitem="o_carmesi"]').innerText.includes("Puesto")));
await clickIn('[data-coinitem="a_vacio"]', "Comprar"); await sleep(250);
check("can't overspend (120 with 60)", (await attr("[data-coinbal]", "data-coinbal")) === "60" && await page.evaluate(() => document.querySelector("[data-coinmsg]").innerText.includes("No tienes suficientes")));
await clickIn("[data-coinstore]", "Modo prueba"); await clickIn("[data-coinstore]", "Modo prueba"); await sleep(200);
await clickIn('[data-coinitem="a_oro"]', "Comprar"); await clickIn('[data-coinitem="n_oro"]', "Comprar"); await sleep(400);
check("aura + name color bought", (await attr("[data-coinbal]", "data-coinbal")) === String(260 - 80 - 30));
await page.mouse.move(5, 5); await sleep(500);
await page.screenshot({ path: path.join(root, "shots/coin-store.png") });
await clickIn("[data-coinstore]", "Monturas"); await sleep(200); check("mounts tab: mounts for sale", await page.evaluate(() => document.querySelector("[data-coinstore]").innerText.includes("+25% de velocidad") && !!document.querySelector('[data-coinitem="m_caballo"]')));
await clickIn("[data-coinstore]", "Utilidades"); await sleep(200);
await clickIn('[data-coinitem="bag"]', "Comprar"); await sleep(250);
check("bigger backpack: 26 slots", await page.evaluate(() => document.body.innerText.includes("Mochila (0/26)") || /\/26\)/.test(document.body.innerText)));
await page.screenshot({ path: path.join(root, "shots/coin-store-utils.png") });
await clickIn("[data-coinstore]", "Modo prueba"); await sleep(200);
const coinsNow = Number(await attr("[data-coinbal]", "data-coinbal"));
await clickIn("[data-coinstore]", "Ir con Darío"); let ok = false; for (let i = 0; i < 60 && !ok; i++) { await sleep(200); ok = await has("[data-exchange]"); }
check("«Ir con Darío» walks to the money changer and opens the exchange", ok);
check("rate shown: 1 Edisar Coin = 10,000 de oro", await page.evaluate(() => document.querySelector("[data-exchange]").innerText.includes("1 Edisar Coin = 10,000 de oro")));
const gold0 = Number(await attr("[data-exbal-gold]", "data-exbal-gold"));
await page.evaluate(() => document.querySelector('[data-exchange] button[aria-label="Más"]').click()); await page.evaluate(() => document.querySelector('[data-exchange] button[aria-label="Más"]').click()); await sleep(200);
await page.mouse.move(5, 5); await sleep(300); await page.screenshot({ path: path.join(root, "shots/coin-exchange.png") });
await page.evaluate(() => document.querySelector("[data-exgo]").click()); await sleep(250);
check("coins → gold: 3 coins = 30,000 gold", Number(await attr("[data-exbal-coins]", "data-exbal-coins")) === coinsNow - 3 && Number(await attr("[data-exbal-gold]", "data-exbal-gold")) === gold0 + 30000);
await page.evaluate(() => { const i = document.querySelector('[data-exchange] input[aria-label="Cantidad"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "999999"); i.dispatchEvent(new Event("input", { bubbles: true })); }); await sleep(200);
check("quantity can't exceed balance", Number(await page.evaluate(() => document.querySelector('[data-exchange] input[aria-label="Cantidad"]').value)) === coinsNow - 3);
await clickIn("[data-exchange]", "Oro → Coins"); await sleep(150); await clickIn("[data-exchange]", "Máx"); await sleep(150);
const g1 = Number(await attr("[data-exbal-gold]", "data-exbal-gold")), c1 = Number(await attr("[data-exbal-coins]", "data-exbal-coins"));
await page.evaluate(() => document.querySelector("[data-exgo]").click()); await sleep(250);
const k = Math.floor(g1 / 10000);
check("gold → coins (Máx)", Number(await attr("[data-exbal-coins]", "data-exbal-coins")) === c1 + k && Number(await attr("[data-exbal-gold]", "data-exbal-gold")) === g1 - k * 10000, `${k} coins`);
await page.keyboard.press("Escape"); await sleep(200); check("Esc closes the exchange", !(await has("[data-exchange]")));
check("AFK filter default: Todo", (await attr("[data-afkmin]", "data-afkmin")) === "com");
await page.evaluate(() => document.querySelector('[data-afkopt="rar"]').click()); await sleep(200);
check("AFK filter → Raro+ (azul, morado, Heaven)", (await attr("[data-afkmin]", "data-afkmin")) === "rar");
const coinsSaved = await attr("[data-coins]", "data-coins");
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1200);
check("coins persist after reload", (await attr("[data-coins]", "data-coins")) === coinsSaved, coinsSaved);
check("AFK filter persists", (await attr("[data-afkmin]", "data-afkmin")) === "rar");
await page.keyboard.press("KeyK"); await sleep(300);
check("purchases persist (outfit worn, bag 26)", await page.evaluate(() => document.querySelector('[data-coinitem="o_carmesi"]').innerText.includes("Puesto")) && await page.evaluate(() => /\/26\)/.test(document.body.innerText)));
// Túnica de Nubes Rojas (Cosméticos, 90 coins): store card, purchase, worn in the world in all 4 facings, on foot and mounted
const fs = await import("node:fs");
for (let i = 0; i < 3; i++) await clickIn("[data-coinstore]", "Modo prueba"); await sleep(200);
await clickIn("[data-coinstore]", "Cosméticos"); await sleep(200);
check("Túnica de Nubes Rojas in Cosméticos for 🪙 90", await page.evaluate(() => { const e = document.querySelector('[data-coinitem="o_nubes"]'); return !!e && e.innerText.includes("Túnica de Nubes Rojas") && e.innerText.includes("90"); }));
const nb0 = Number(await attr("[data-coinbal]", "data-coinbal"));
await clickIn('[data-coinitem="o_nubes"]', "Comprar"); await sleep(250);
check("buying the cloud robe deducts 90 and wears it", Number(await attr("[data-coinbal]", "data-coinbal")) === nb0 - 90 && await page.evaluate(() => document.querySelector('[data-coinitem="o_nubes"]').innerText.includes("Puesto")));
fs.mkdirSync("/tmp/nubes", { recursive: true });
const card = await page.$('[data-coinitem="o_nubes"]'); await page.evaluate(() => document.querySelector('[data-coinitem="o_nubes"]').scrollIntoView({ block: "center" })); await sleep(200);
await card.screenshot({ path: "/tmp/nubes/store.png" });
await clickIn("[data-coinstore]", "Monturas"); await sleep(200); await clickIn('[data-coinitem="m_caballo"]', "Comprar"); await sleep(250);
await page.keyboard.press("Escape"); await sleep(250); await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.move(5, 5); await sleep(300);
const robePx = () => page.evaluate(() => { const cv = document.querySelector('canvas[data-drop="map"]'); const ctx = cv.getContext("2d"); const r = cv.getBoundingClientRect();
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data; const xs = [], ys = [];
  for (let i = 0; i < d.length; i += 4) if (d[i] === 0x12 && d[i + 1] === 0x10 && d[i + 2] === 0x14) { const p = i / 4; xs.push(p % cv.width); ys.push(Math.floor(p / cv.width)); }
  if (xs.length < 20) return null; xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  return { x: r.left + (xs[xs.length >> 1] * r.width) / cv.width, y: r.top + (ys[ys.length >> 1] * r.height) / cv.height, n: xs.length }; });
const red = () => page.evaluate(() => { const cv = document.querySelector('canvas[data-drop="map"]'); const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xd0 && d[i + 1] === 0x18 && d[i + 2] === 0x28) n++; return n; });
const faces = [["ArrowDown", "abajo"], ["ArrowLeft", "izquierda"], ["ArrowUp", "arriba"], ["ArrowRight", "derecha"]];
const shot = async (file) => { const p = await robePx(); if (!p) return false; await page.screenshot({ path: file, clip: { x: p.x - 34, y: p.y - 44, width: 68, height: 72, scale: 4 } }); return true; };
let okFoot = true, okRide = true;
for (const [k, n] of faces) { await page.keyboard.down(k); await sleep(160); await page.keyboard.up(k); await sleep(600); const p = await robePx(); okFoot = okFoot && !!p && (await red()) > 4; await shot(`/tmp/nubes/pie-${n}.png`); }
check("cloud robe drawn on foot in all 4 facings (black + red clouds)", okFoot);
await page.keyboard.press("KeyR"); await sleep(500);
for (const [k, n] of faces) { await page.keyboard.down(k); await sleep(160); await page.keyboard.up(k); await sleep(600); const p = await robePx(); okRide = okRide && !!p && (await red()) > 4; await shot(`/tmp/nubes/montado-${n}.png`); }
check("cloud robe drawn while mounted in all 4 facings", okRide);
await page.screenshot({ path: path.join(root, "shots/outfit-nubes-rojas-world.png") });
{ // compose shots/outfit-nubes-rojas.png: store card + 4 facings on foot + 4 facings mounted
  const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const row = (pre) => faces.map(([, n]) => `<figure><img src="${b64(`/tmp/nubes/${pre}-${n}.png`)}"><figcaption>${n}</figcaption></figure>`).join("");
  const cp = await browser.newPage(); await cp.setViewport({ width: 1300, height: 800 });
  await cp.setContent(`<html><body style="margin:0;background:#1b1712;color:#f0d890;font:14px Georgia,serif;padding:14px;display:inline-block">
    <h2 style="margin:0 0 10px">Túnica de Nubes Rojas — 🪙 90 (Tienda de Edisar Coins › Cosméticos)</h2>
    <div style="display:flex;gap:16px;align-items:flex-start"><div><img src="${b64("/tmp/nubes/store.png")}" style="zoom:1.6;image-rendering:pixelated"><div>En la tienda</div></div>
    <div><div>A pie</div><div style="display:flex;gap:6px">${row("pie")}</div><div style="margin-top:8px">Montado</div><div style="display:flex;gap:6px">${row("montado")}</div></div></div>
    <style>figure{margin:0;text-align:center}img{display:block;image-rendering:pixelated;width:204px;border:2px solid #6a5530}</style></body></html>`);
  await sleep(300); const el = await cp.$("body"); await el.screenshot({ path: path.join(root, "shots/outfit-nubes-rojas.png") }); await cp.close();
}
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
