// Quick headless UI check: backpack hover tooltip, Shift compare, H opens Atajos. Usage: node scripts/test-ui.mjs
import puppeteer from "puppeteer-core"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.type("input", "Tipper"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Comenzar aventura")).click()); await sleep(1200);
// put a copy of every equipped item into the backpack via the save, then continue
await page.reload(); await sleep(500); // unload hooks save the new character; now on title screen (no autosave there)
await page.evaluate(() => {
  const k = "edisar.autosave.v1"; const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  let u = d.nextUid; d.bag = Object.values(d.eq).filter(Boolean).map((i) => ({ ...i, uid: u++, rar: "rar", st: {} })); d.nextUid = u;
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
});
await page.reload(); await sleep(600);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click()); await sleep(1200);
const cell = await page.$('[data-drop="bag:0"]'); const box = cell && await cell.boundingBox();
check("backpack has items", !!box && (await page.evaluate(() => document.querySelector('[data-drop="bag:0"]').textContent.trim().length > 0)));
const before = await page.evaluate(() => document.body.innerText);
await page.mouse.move(box.x + 5, box.y + 5); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 }); await sleep(400);
const after = await page.evaluate(() => document.body.innerText);
const added = after.split("\n").filter((l) => !before.includes(l)).slice(0, 8);
check("tooltip appears on hovering backpack item", added.length > 0, added.join(" | ").slice(0, 200));
await page.screenshot({ path: path.join(root, "shots/ui-tooltip.png") });
check("tooltip offers Shift compare", after.includes("Mayús: ver equipado") || /▲|▼|Igual|mejor|peor/i.test(added.join(" ")));
await page.keyboard.down("Shift"); await sleep(300); await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2); await sleep(300);
const shiftTxt = await page.evaluate(() => document.body.innerText); await page.screenshot({ path: path.join(root, "shots/ui-tooltip-shift.png") }); await page.keyboard.up("Shift");
check("Shift changes tooltip (equipped shown)", shiftTxt !== after && !shiftTxt.includes("Mayús: ver equipado"));
await page.mouse.move(5, 5); await sleep(300);
const cnt = () => page.evaluate(() => (document.body.innerText.match(/⌨️ Atajos/g) || []).length);
const c0 = await cnt(); await page.keyboard.press("KeyH"); await sleep(400); const c1 = await cnt();
await page.screenshot({ path: path.join(root, "shots/ui-atajos.png") });
check("H opens Atajos window", c1 > c0, `'⌨️ Atajos' count ${c0} → ${c1}`);
await page.keyboard.press("KeyH"); await sleep(400); check("H again closes it", (await cnt()) === c0);
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
