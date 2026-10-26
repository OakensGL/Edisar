// Headless Chrome tests for dist/index.html over file:// and http://. Usage: node scripts/test.mjs [--quick]
import puppeteer from "puppeteer-core"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const QUICK = process.argv.includes("--quick");
const html = fs.readFileSync(path.join(root, "dist/index.html"));
const srv = http.createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(html); });
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const targets = [["file", "file://" + path.join(root, "dist/index.html")], ["http", `http://127.0.0.1:${srv.address().port}/`]];
fs.mkdirSync(path.join(root, "shots"), { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true,
  args: ["--no-sandbox", "--allow-file-access-from-files", "--window-size=1366,900"], defaultViewport: { width: 1366, height: 900 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LS = "edisar.autosave.v1";
const readSave = (page) => page.evaluate((k) => { const c = localStorage.getItem(k); if (!c) return null; const b = c.split("-")[2]; return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0)))); }, LS);
const writeSave = (page, d) => page.evaluate((k, d) => {
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`); }, LS, d);
const clickText = (page, t) => page.evaluate((t) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(t)); if (!b) return false; b.click(); return true; }, t);
const hasText = (page, t) => page.evaluate((t) => document.body.innerText.includes(t), t);
const results = []; const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };

for (const [kind, url] of targets) {
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(url, { waitUntil: "load" }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "load" }); await sleep(800);
  check(`[${kind}] title screen renders`, await hasText(page, "Comenzar aventura"));
  check(`[${kind}] no 'Continuar última partida' on fresh storage`, !(await hasText(page, "Continuar última partida")));
  check(`[${kind}] localStorage usable`, await page.evaluate(() => { try { localStorage.setItem("t", "1"); localStorage.removeItem("t"); return true; } catch { return false; } }));
  await page.screenshot({ path: path.join(root, `shots/${kind}-title.png`) });
  await page.type("input", "Tester"); await clickText(page, "Comenzar aventura"); await sleep(1500);
  check(`[${kind}] game screen renders`, await hasText(page, "Guardar"));
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); const start = await readSave(page);
  // move: hold right then down
  await page.keyboard.down("ArrowRight"); await sleep(1200); await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowDown"); await sleep(800); await page.keyboard.up("ArrowDown"); await sleep(600);
  await page.screenshot({ path: path.join(root, `shots/${kind}-ingame.png`) });
  // 1) 30 s interval autosave
  if (!QUICK) { await page.evaluate((k) => localStorage.removeItem(k), LS); await sleep(31500);
    const s = await readSave(page); check(`[${kind}] 30 s interval autosave writes localStorage`, !!s, s ? `pos ${s.x},${s.y}` : ""); }
  // 2) visibilitychange(hidden) autosave
  await page.evaluate((k) => { localStorage.removeItem(k); Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); }, LS);
  check(`[${kind}] visibilitychange(hidden) autosave`, !!(await readSave(page)));
  // 3) Guardar button
  await page.evaluate((k) => localStorage.removeItem(k), LS); await clickText(page, "💾 Guardar"); await sleep(300);
  check(`[${kind}] 'Guardar' saves to localStorage + says so`, !!(await readSave(page)) && (await hasText(page, "También quedó guardada en este navegador")));
  await page.keyboard.press("Escape"); await sleep(200);
  // 4) beforeunload/pagehide: clear, reload, should be re-saved by the unload hooks
  const before = await readSave(page); const moved = before && start && (before.x !== start.x || before.y !== start.y);
  await page.evaluate((k) => localStorage.removeItem(k), LS); await page.reload({ waitUntil: "load" }); await sleep(800);
  const afterUnload = await readSave(page); check(`[${kind}] tab close/reload (beforeunload/pagehide) autosave`, !!afterUnload);
  // Enrich the save (level + backpack) to verify restore of those fields
  const d = afterUnload || before; const item = d.eq.weapon || Object.values(d.eq).find(Boolean);
  d.exp = 20000; d.bag = [{ ...item, uid: d.nextUid }, { ...item, uid: d.nextUid + 1 }]; d.nextUid += 2; d.gold = 777; await writeSave(page, d);
  await page.reload({ waitUntil: "load" }); await sleep(800);
  const label = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent).find((t) => t.includes("Continuar última partida")) || "");
  check(`[${kind}] 'Continuar última partida' appears after reload`, !!label, label);
  const lvlShown = Number((label.match(/nivel (\d+)/) || [])[1]);
  await clickText(page, "Continuar última partida"); await sleep(1500);
  check(`[${kind}] continued game loads`, await hasText(page, "Guardar"));
  await page.evaluate((k) => { localStorage.removeItem(k); window.dispatchEvent(new Event("pagehide")); }, LS);
  const r = await readSave(page);
  check(`[${kind}] restored position`, r && r.x === d.x && r.y === d.y, r ? `saved ${d.x},${d.y} → restored ${r.x},${r.y}` : "");
  check(`[${kind}] restored level`, r && r.level === lvlShown && r.level > 1, r ? `level ${r.level}` : "");
  check(`[${kind}] restored backpack + gold`, r && r.bag.length === 2 && r.bag[0].id === item.id && r.gold === 777, r ? `bag ${r.bag.map((b) => b.id).join(",")} gold ${r.gold}` : "");
  check(`[${kind}] player actually moved before saving`, !!moved, before && start ? `start ${start.x},${start.y} → ${before.x},${before.y}` : "");
  // 5) Nueva partida saves then returns to title
  await page.evaluate((k) => localStorage.removeItem(k), LS); await clickText(page, "Nueva partida"); await sleep(600);
  check(`[${kind}] 'Nueva partida' saves + returns to title with Continuar`, !!(await readSave(page)) && (await hasText(page, "Continuar última partida")));
  // 6) fullscreen really enters document fullscreen
  await clickText(page, "Pantalla completa"); await sleep(500);
  const fsOn = await page.evaluate(() => !!document.fullscreenElement); check(`[${kind}] real fullscreen (document.fullscreenElement)`, fsOn);
  if (fsOn) { await page.screenshot({ path: path.join(root, `shots/${kind}-title-fullscreen.png`) }); await clickText(page, "Salir"); }
  check(`[${kind}] no console errors`, errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();
}
await browser.close(); srv.close();
const bad = results.filter((r) => !r.ok); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0);
