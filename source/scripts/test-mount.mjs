// Headless check: mounts (R key, 🐎 Monturas window, Tomás gold mount, coin store mounts, riding sprite, persistence).
// Screenshots: shots/mounts-window.png, shots/mount-riding.png
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
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Jinete"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
const s0 = await readSave(); check("old-style save has no mounts", s0 && s0.mt === undefined);
await page.evaluate((k) => { // seed gold + coins
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  d.gold = 5000; d.cs = { ...(d.cs || {}), coins: 400 };
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K);
await page.reload(); await sleep(600);
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
await cont(); await sleep(1200);
const has = (s) => page.evaluate((x) => !!document.querySelector(x), s);
const txt = (s) => page.evaluate((x) => document.querySelector(x)?.textContent ?? "", s);
const click = (s) => page.evaluate((x) => document.querySelector(x).click(), s);
const waitFor = async (s, n = 60) => { for (let i = 0; i < n; i++) { if (await has(s)) return true; await sleep(150); } return false; };
check("coins seeded", (await page.evaluate(() => Number(document.querySelector("[data-coins]")?.getAttribute("data-coins")))) === 400);
check("HUD has 🐎 Monturas and 🐎 Montar buttons", (await has("[data-mountbtn]")) && (await has("[data-ridebtn]")));
await page.keyboard.press("KeyR"); await sleep(250);
check("R without mounts opens the window with a hint", (await has("[data-mounts]")) && (await txt("[data-mtmsg]")).includes("Aún no tienes"));
check("window lists all mounts with speed", (await page.evaluate(() => document.querySelectorAll("[data-mounts] [data-mount]").length)) === 10 && (await txt("[data-mounts]")).includes("+40% de velocidad"));
await click('[data-mtgo="m_burro"]');
check("«Ir con Tomás» walks to the stable", await waitFor('[data-mtbuy="m_burro"]'));
await click('[data-mtbuy="m_burro"]'); await sleep(250);
check("buy Burro with gold at Tomás", (await page.evaluate(() => document.querySelector('[data-mount="m_burro"]').getAttribute("data-own"))) === "1" && (await txt("[data-mtcount]")).includes("1/10"));
await click('[data-mtbuy="m_caballo"]'); await sleep(250);
check("buy Caballo with coins in the window", (await page.evaluate(() => document.querySelector('[data-mount="m_caballo"]').getAttribute("data-own"))) === "1" && (await page.evaluate(() => Number(document.querySelector("[data-coins]").getAttribute("data-coins")))) === 250);
await page.keyboard.press("Escape"); await sleep(200); check("Esc closes the window", !(await has("[data-mounts]")));
// coin store tab
await page.keyboard.press("KeyK"); await sleep(250);
await page.evaluate(() => [...document.querySelectorAll("[data-coinstore] button")].find((b) => b.textContent.includes("Monturas")).click()); await sleep(250);
check("store Monturas tab: no «Próximamente»", !(await txt("[data-coinstore]")).includes("Próximamente"));
await page.evaluate(() => [...document.querySelectorAll('[data-coinitem="m_lobo"] button')].find((b) => b.textContent.includes("Comprar")).click()); await sleep(250);
check("buy Lobo in the store", (await page.evaluate(() => Number(document.querySelector("[data-coins]").getAttribute("data-coins")))) === 0 && (await txt('[data-coinitem="m_lobo"]')).includes("Tuya"));
check("store shows how to get boss mounts", (await txt('[data-coinitem="m_leon"]')).includes("Aioria"));
await page.keyboard.press("Escape"); await sleep(200);
// choose + ride
await click("[data-mountbtn]"); await sleep(250);
await click('[data-mtpick="m_caballo"]'); await sleep(250);
check("pick Caballo → riding", (await txt("[data-ridebtn]")).includes("Bajar") && (await txt("[data-mounts]")).includes("Montas Caballo pardo"));
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await page.screenshot({ path: path.join(root, "shots/mounts-window.png") });
await page.keyboard.press("Escape"); await sleep(200);
await page.keyboard.press("KeyR"); await sleep(150); check("R dismounts", (await txt("[data-ridebtn]")).includes("Montar"));
await page.keyboard.press("KeyR"); await sleep(150); check("R mounts again", (await txt("[data-ridebtn]")).includes("Bajar"));
// walk a bit mounted and take the riding screenshot
await page.keyboard.down("KeyW"); await sleep(500); await page.keyboard.up("KeyW"); await page.keyboard.down("KeyD"); await sleep(380); await page.keyboard.up("KeyD"); await sleep(400);
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await page.screenshot({ path: path.join(root, "shots/mount-riding.png") });
if (process.env.ZOOM) { const cv = await page.$("canvas"); const b = await cv.boundingBox(); await page.screenshot({ path: "/tmp/zoom.png", clip: { x: b.x + b.width * 0.25, y: b.y + b.height * 0.2, width: b.width * 0.3, height: b.height * 0.45, scale: 3 } }); }
// Atajos lists the action
await page.keyboard.press("KeyH"); await sleep(250);
check("Atajos lists «Montar / desmontar»", await page.evaluate(() => document.body.innerText.includes("Montar / desmontar")));
await page.keyboard.press("KeyH"); await sleep(150);
// persistence
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "💾 Guardar")?.click()); await sleep(400);
await page.keyboard.press("Escape"); await sleep(200);
await page.reload(); await sleep(600); await cont(); await sleep(1200);
const s1 = await readSave();
check("save has mounts", s1 && s1.mt && s1.mt.owned.length === 3 && s1.mt.active === "m_caballo" && s1.mt.riding === true, JSON.stringify(s1 && s1.mt));
check("after reload: still riding", (await txt("[data-ridebtn]")).includes("Bajar"));
await click("[data-mountbtn]"); await sleep(250);
check("after reload: 3 mounts owned", (await txt("[data-mtcount]")).includes("3/10"));
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
const n = res.filter(Boolean).length; console.log(`${n}/${res.length} passed`); await browser.close(); process.exit(n === res.length ? 0 : 1);
