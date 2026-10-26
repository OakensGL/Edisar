// Headless check: mouse-wheel zoom on the HUD minimap (clamped levels, no page scroll, wheel elsewhere untouched, +/- buttons, saved).
// Usage: node scripts/test-minimap.mjs   → also writes shots/minimap-zoom.png (zoomed minimap) and shots/minimap-zoom-full.png
import puppeteer from "puppeteer-core"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900, deviceScaleFactor: 2 } });
const page = await browser.newPage(); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Zoomer"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Comenzar aventura")).click()); await sleep(1200);
const zoom = () => page.evaluate(() => Number(document.querySelector("[data-minizoom]")?.getAttribute("data-minizoom")));
const label = () => page.evaluate(() => document.querySelector("[data-minizoom-label]")?.textContent ?? "");
const pix = () => page.evaluate(() => { const c = document.querySelector("[data-minizoom] canvas"); return c.toDataURL(); });
// make the page itself scrollable so we can prove the wheel over the minimap does not scroll it
await page.evaluate(() => { document.body.style.minHeight = "4000px"; window.scrollTo(0, 100); }); await sleep(200);
const box = await (await page.$("[data-minizoom] canvas")).boundingBox();
check("minimap present with zoom 1x", !!box && (await zoom()) === 1 && (await label()) === "1x", `${await label()}`);
const p1 = await pix(); const y0 = await page.evaluate(() => window.scrollY);
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
await page.mouse.wheel({ deltaY: -100 }); await sleep(250);
check("wheel up over minimap zooms in (1x → 1.5x)", (await zoom()) === 1.5, `${await label()}`);
check("page did not scroll", (await page.evaluate(() => window.scrollY)) === y0, `scrollY ${y0} → ${await page.evaluate(() => window.scrollY)}`);
const seen = []; for (let i = 0; i < 8; i++) { await page.mouse.wheel({ deltaY: -100 }); await sleep(120); seen.push(await zoom()); }
check("zoom in is clamped at 4x", seen.at(-1) === 4 && Math.max(...seen) === 4 && (await label()) === "4x", seen.join(","));
check("page still not scrolled after many wheel steps", (await page.evaluate(() => window.scrollY)) === y0);
await sleep(300); check("minimap image changes when zoomed", (await pix()) !== p1);
const seen2 = []; for (let i = 0; i < 8; i++) { await page.mouse.wheel({ deltaY: 100 }); await sleep(120); seen2.push(await zoom()); }
check("wheel down zooms out, clamped at 1x", seen2.at(-1) === 1 && Math.min(...seen2) === 1, seen2.join(","));
// tiny trackpad deltas accumulate (no step on one tiny tick)
await page.mouse.wheel({ deltaY: -12 }); await sleep(120); const t1 = await zoom();
for (let i = 0; i < 6; i++) { await page.mouse.wheel({ deltaY: -12 }); await sleep(60); }
check("small trackpad deltas accumulate into one step", t1 === 1 && (await zoom()) === 1.5, `${t1} → ${await zoom()}`);
// wheel elsewhere: zoom unchanged, page scrolls normally
await page.mouse.move(box.x - 600, box.y + box.height / 2); const zb = await zoom(); const ys = await page.evaluate(() => window.scrollY);
await page.mouse.wheel({ deltaY: 200 }); await sleep(400);
check("wheel elsewhere does not change minimap zoom", (await zoom()) === zb);
check("wheel elsewhere scrolls the page as usual", (await page.evaluate(() => window.scrollY)) > ys, `scrollY ${ys} → ${await page.evaluate(() => window.scrollY)}`);
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200);
// +/- buttons (touch / trackpad friendly)
const clickBtn = (lbl) => page.evaluate((l) => document.querySelector(`[data-minizoom] button[aria-label="${l}"]`).click(), lbl);
await clickBtn("Acercar minimapa"); await sleep(150); check("+ button zooms in", (await zoom()) === 2, `${await label()}`);
await clickBtn("Alejar minimapa"); await sleep(150); check("− button zooms out", (await zoom()) === 1.5);
await clickBtn("Acercar minimapa"); await clickBtn("Acercar minimapa"); await sleep(150); // 3x
// screenshot zoomed minimap
await page.mouse.move(5, 5); await sleep(400);
const wrap = await page.$("[data-minizoom]"); await wrap.screenshot({ path: path.join(root, "shots/minimap-zoom.png") });
await page.screenshot({ path: path.join(root, "shots/minimap-zoom-full.png") });
// zoom is remembered in the save
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1200);
check("zoom level restored from save", (await zoom()) === 3, `${await label()}`);
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
