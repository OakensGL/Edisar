// Headless check: several characters per account (Tibia-style). Migration of the old single save (edisar.autosave.v1) to slot 1
// with nothing lost + untouched backup, create / switch / delete (with confirmation) keep saves separate, Edisar Coins + Premium shared
// by the account, autosave writes the ACTIVE character, old codes import as a new character. Screenshot: shots/char-select.png
import puppeteer from "puppeteer-core"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const OLD = "edisar.autosave.v1", ACC = "edisar.account.v1", BK = "edisar.autosave.v1.backup", CH = (id) => "edisar.char." + id;
const get = (k) => page.evaluate((k) => localStorage.getItem(k), k);
const acc = async () => JSON.parse((await get(ACC)) || "null");
const dec = (c) => c ? JSON.parse(Buffer.from(c.split("-")[2], "base64").toString("utf8")) : null;
const enc = (d) => { const body = Buffer.from(JSON.stringify(d), "utf8").toString("base64"); let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); } return `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`; };
const clickTxt = (t) => page.evaluate((t) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(t)); if (b) b.click(); return !!b; }, t);
const click = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (b) b.click(); return !!b; }, sel);
const has = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
const text = () => page.evaluate(() => document.body.innerText);
const inGame = () => has("[data-charsbtn]");
const create = async (name, voc) => { await page.evaluate(() => { const i = document.querySelector('input[aria-label="Nombre del personaje"]'); i.focus(); i.select(); }); await page.keyboard.type(name);
  await page.select('select[aria-label="Vocación"]', voc); await click("[data-create]"); await sleep(1300); };
const toList = async () => { await click("[data-charsbtn]"); await sleep(700); };

// 0) Make a realistic "old" single save: a level-70 warlock with gold, coins, Premium, quests, houses, mount, depot…
await page.goto("file://" + path.join(root, "dist/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(700);
check("fresh storage: empty list, no Continuar", (await has("[data-chars='0']")) && !(await text()).includes("Continuar última partida"));
await create("Edisar", "warlock"); check("tmp character starts", await inGame());
await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); const base = dec(await get(CH("c1")));
const d = { ...base, level: 70, exp: 5300000, gold: 4321987, cleared: 12, kills: 9876, deaths: 3, x: base.x, y: base.y, savedAt: 1792000000000,
  cs: { ...base.cs, coins: 345, premUntil: Date.now() + 5 * 86400000, owned: ["o_carmesi"], outfit: "o_carmesi", scrolls: 4 }, mt: { owned: ["m_caballo"], active: "m_caballo" } };
d.bag = [{ ...(Object.values(base.eq).find(Boolean)), uid: d.nextUid }]; d.nextUid += 1;
const OLDCODE = enc(d);
await page.goto("about:blank"); await page.goto("file://" + path.join(root, "dist/index.html"));
await page.evaluate((k, v) => { localStorage.clear(); localStorage.setItem(k, v); }, OLD, OLDCODE); await page.reload(); await sleep(900);

// 1) Migration
const a1 = await acc();
check("migration: old save became character slot 1", a1 && a1.chars.length === 1 && a1.chars[0].id === "c1" && a1.last === "c1", JSON.stringify(a1 && a1.chars));
check("migration: slot 1 code is an exact copy (nothing lost)", (await get(CH("c1"))) === OLDCODE);
check("migration: old key kept untouched", (await get(OLD)) === OLDCODE);
check("migration: backup copy written", (await get(BK)) === OLDCODE);
check("migration: coins + Premium moved to the account", a1.coins === 345 && a1.premUntil === d.cs.premUntil);
const t1 = await text();
check("list shows name, vocation, level, last played", t1.includes("Edisar") && /Brujo · nivel 70/.test(t1) && t1.includes("Última vez:"), (t1.match(/.*nivel 70.*/) || [""])[0]);
check("Continuar continues the migrated character", t1.includes("Continuar última partida (Edisar · Brujo nivel 70)"));
await click("[data-continue='c1']"); await sleep(1300);
check("migrated character loads in game", await inGame());
await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); const m1 = dec(await get(CH("c1")));
check("migrated character keeps level/gold/houses/coins/outfit/bag/mount", m1.level === 70 && m1.gold === 4321987 && m1.cleared === 12 && m1.cs.coins === 345 && m1.cs.outfit === "o_carmesi" && m1.bag.length === 1 && m1.mt?.owned?.includes("m_caballo"),
  `lvl ${m1.level} gold ${m1.gold} houses ${m1.cleared} coins ${m1.cs.coins}`);
check("autosave never writes the old key", (await get(OLD)) === OLDCODE);
await toList(); check("👥 Personajes saves and returns to the list", (await has("[data-chars='1']")) && (await text()).includes("Tus personajes"));

// 2) Create / switch: separate saves, shared coins, autosave on the active character
await create("Segundo", "knight"); check("create character 2 (knight)", await inGame());
check("new character gets the account's coins", (await page.evaluate(() => document.querySelector("[data-coins]")?.getAttribute("data-coins"))) === "345");
await page.keyboard.press("KeyK"); await sleep(300); await page.evaluate(() => { const b = [...document.querySelectorAll("[data-coinstore] button")].find((x) => x.textContent.includes("Modo prueba")); b && b.click(); }); await sleep(250); await page.keyboard.press("Escape"); await sleep(200);
await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
const a2 = await acc(); const c2 = dec(await get(CH("c2")));
check("autosave targets the active character (c2)", a2.last === "c2" && c2 && c2.cls === "knight" && c2.level === 1 && c2.cs.coins === 445);
check("slot 1 untouched while playing slot 2", dec(await get(CH("c1"))).gold === 4321987 && dec(await get(CH("c1"))).cls === "warlock");
check("coins are account-wide (445 after +100 on c2)", a2.coins === 445);
await toList(); await create("Tercera", "druid"); await toList();
check("3 characters listed", (await has("[data-chars='3']")) && (await page.$$("[data-char]")).length === 3);
await page.evaluate(() => document.querySelector("[data-char='c1']").click()); await sleep(200);
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200);
const box = await page.evaluate(() => { const r = document.querySelector("[data-chars]").getBoundingClientRect(); return { y: r.bottom + window.scrollY }; });
await page.setViewport({ width: 1366, height: Math.max(900, Math.ceil(box.y) + 20) }); await sleep(300);
await page.screenshot({ path: path.join(root, "shots/char-select.png") }); await page.setViewport({ width: 1366, height: 900 }); await sleep(200);
await click("[data-charplay='c1']"); await sleep(1300);
check("switch back: Jugar on slot 1 loads the warlock", await inGame() && (await text()).includes("Edisar"));
check("…with the shared coins (445)", (await page.evaluate(() => document.querySelector("[data-coins]")?.getAttribute("data-coins"))) === "445");
const c2before = await get(CH("c2"));
await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await sleep(100);
const a3 = await acc(); const w1 = dec(await get(CH("c1")));
check("autosave now writes slot 1, not slot 2", a3.last === "c1" && w1.level === 70 && w1.cs.coins === 445 && (await get(CH("c2"))) === c2before);
await toList();
check("Continuar points at the last played (slot 1)", (await text()).includes("Continuar última partida (Edisar · Brujo nivel 70)"));

// 3) Delete with confirmation
await click("[data-chardel='c3']"); await sleep(200);
check("Borrar asks for confirmation", (await has("[data-delconfirm='c3']")) && (await text()).includes("¿Borrar a Tercera"));
await click("[data-delno='c3']"); await sleep(200); check("Cancelar keeps it", (await has("[data-char='c3']")) && !!(await get(CH("c3"))));
await click("[data-chardel='c3']"); await sleep(150); await click("[data-delyes='c3']"); await sleep(300);
check("Sí, borrar removes only that character", !(await has("[data-char='c3']")) && !(await get(CH("c3"))) && !!(await get(CH("c1"))) && (await get(CH("c2"))) === c2before && (await acc()).chars.length === 2);

// 4) Import an old code (no coins field, EDISAR2) → new character; then the 6-slot limit
const old2 = { ...d, name: "Importado" }; delete old2.cs; delete old2.mt; const OLD2 = enc(old2);
await clickTxt("Cargar partida"); await sleep(200);
await page.evaluate((v) => { const t = document.querySelector("textarea"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(t, v); t.dispatchEvent(new Event("input", { bubbles: true })); }, OLD2); await sleep(150);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Continuar"); b && b.click(); }); await sleep(1300);
const a4 = await acc(); const imp = a4.chars.find((c) => c.name === "Importado");
check("importing an old code creates a new character and plays it", (await inGame()) && !!imp && a4.last === imp.id && dec(await get(CH(imp.id))).level === 70);
check("import kept the account coins", (await page.evaluate(() => document.querySelector("[data-coins]")?.getAttribute("data-coins"))) === "445");
await toList();
for (const n of ["Cuatro", "Cinco", "Seis"]) { await create(n, "archer"); await toList(); }
check("6 characters max", (await has("[data-chars='6']")));
await create("Siete", "rogue");
check("7th character refused with a message", !(await inGame()) && (await has("[data-charerr]")) && (await acc()).chars.length === 6);
check("old key still untouched at the end", (await get(OLD)) === OLDCODE && (await get(BK)) === OLDCODE);
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close(); console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
