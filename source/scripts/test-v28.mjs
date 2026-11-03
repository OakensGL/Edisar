// v28: atuendos de héroe (lote 1): hoja de sprites, tienda, guardado por personaje y lista de personajes. Build first: TESTHOOK=1 node scripts/build.mjs
import path from "node:path"; import fs from "node:fs";
const G = process.env.GAME_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const puppeteer = (await import(path.join(G, "node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"))).default;
const { activeShim } = await import(path.join(G, "scripts/active-shim.mjs"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const K = "@active";
const seed = (fn, arg) => page.evaluate((k, src, a) => {
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  (0, eval)(src)(d, a);
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K, fn.toString(), arg);
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const ev = (fn, a) => page.evaluate(fn, a);
const status = () => ev(() => globalThis.__edisarG.current.status || "");
const at = () => ev(() => [globalThis.__edisarG.current.p.x, globalThis.__edisarG.current.p.y]);
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", f) }); };
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; g.heldDirs = []; g.zone = ""; }, [x, y]);
const key = async (k, hold = 140) => { await page.keyboard.down(k); await sleep(hold); await page.keyboard.up(k); await sleep(500); };
const click = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (b) b.click(); return !!b; }, sel);
const select = async (sel, v) => { await page.select(sel, v); await sleep(80); };
const EXP = (L) => Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12));
const newChar = async (cls, name, L, extra) => {
  await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(500);
  await page.select('select[aria-label="Vocación"]', cls); await page.type("input", name);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1000);
  await page.reload(); await sleep(400);
  await seed((d, a) => { d.level = a.L; d.exp = a.exp; d.hpPot = 300; d.manaPot = 300; d.cleared = a.cleared; if (a.extra) Object.assign(d, a.extra); }, { L, exp: EXP(L), cleared: 11, extra });
  await page.reload(); await sleep(500); await cont(); await sleep(1300);
};
// recorte del lienzo del juego alrededor de una casilla (escala = ancho / 672 px lógicos)
const crop = async (wx, wy, tw, th) => ev(([wx, wy, tw, th]) => { const g = globalThis.__edisarG.current; const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width - a.width)[0]; const k = c.width / 672;
  const o = document.createElement("canvas"); o.width = Math.round(tw * 32 * k); o.height = Math.round(th * 32 * k); o.getContext("2d").drawImage(c, (wx * 32 - g.camX) * k, (wy * 32 - g.camY) * k, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL().split(",")[1]; }, [wx, wy, tw, th]);
const compose = async (rows, title, file, big) => { const p2 = await browser.newPage(); await p2.setViewport({ width: 1180, height: 80 + rows.length * 220 + (big ? 520 : 0) });
  const html = `<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:12px 18px">${title}</h2>` + (big ? `<img src="data:image/png;base64,${big}" style="margin:0 18px;width:820px;border:1px solid #5a4a3a">` : "") + rows.map((r) => `<div style="display:flex;align-items:center;margin:6px 18px"><div style="width:170px;font-weight:bold">${r.label}</div>` + r.out.map((o) => `<div style="text-align:center;margin:0 6px"><img src="data:image/png;base64,${o.img}" style="width:180px;height:180px;image-rendering:pixelated;border:1px solid #5a4a3a;background:#000"><div style="font-size:12px">${o.cap}</div></div>`).join("") + `</div>`).join("") + `</body></html>`;
  await p2.setContent(html); await sleep(300); await p2.screenshot({ path: path.join(G, "shots", file), fullPage: true }); await p2.close(); };
const FACES = [[2, "abajo"], [1, "derecha"], [3, "izquierda"], [0, "arriba"]];
const HEROES = [["o_gojo", "gojo", "Satoru Gojo"], ["o_itachi", "itachi", "Itachi Uchiha"], ["o_rengoku", "rengoku", "Kyojuro Rengoku"], ["o_kirito", "kirito", "Kirito"], ["o_mihawk", "mihawk", "Dracule Mihawk"], ["o_freezer", "freezer", "Freezer (forma final)"]];
await newChar("knight", "Heroe", 60);
// hoja de sprites: 6 atuendos × (sur, este, norte, oeste, paso sur, paso este)
const COLS = [[2, 0, "sur"], [1, 0, "este"], [0, 0, "norte"], [3, 0, "oeste"], [2, 1, "paso sur"], [1, 2, "paso este"]];
const sheet = await ev(([H, C]) => { const S = 6, cw = 40, ch = 46; const o = document.createElement("canvas"); o.width = C.length * cw * S; o.height = H.length * ch * S; const x = o.getContext("2d"); x.imageSmoothingEnabled = false;
  x.fillStyle = "#3a5a2a"; x.fillRect(0, 0, o.width, o.height);
  H.forEach((h, r) => C.forEach(([f, ph], k) => { x.save(); x.setTransform(S, 0, 0, S, k * cw * S, r * ch * S); x.fillStyle = (r + k) % 2 ? "#4a6a36" : "#42622f"; x.fillRect(0, 0, cw, ch); globalThis.__edisarHero(x, 4, 12, h[1], f, ph, 1000); x.restore(); }));
  return o.toDataURL().split(",")[1]; }, [HEROES, COLS]);
{ const p2 = await browser.newPage(); await p2.setViewport({ width: 1020, height: 900 });
  await p2.setContent(`<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:10px 18px">Edisar v28 — atuendos de héroe (lote 1): filas = atuendo · columnas = ${COLS.map((c) => c[2]).join(" · ")}</h2><div style="display:flex;margin:0 18px"><div>${HEROES.map((h) => `<div style="height:${46 * 3}px;display:flex;align-items:center;width:190px;font-weight:bold">${h[2]}</div>`).join("")}</div><img src="data:image/png;base64,${sheet}" style="height:${HEROES.length * 46 * 3}px;image-rendering:pixelated"></div></body></html>`);
  if (process.env.RAWSHEET) fs.writeFileSync(process.env.RAWSHEET, Buffer.from(sheet, "base64"));
  await sleep(300); await p2.screenshot({ path: path.join(G, "shots", "v28-outfits.png"), fullPage: true }); await p2.close(); }
check("hoja de los 6 atuendos (4 direcciones + paso)", fs.existsSync(path.join(G, "shots/v28-outfits.png")));
// tienda de Edisar Coins: sección «Atuendos de héroe», compra con coins, «Usar», y el GM sigue siendo Minato
await ev(() => { const g = globalThis.__edisarG.current; g.cs.coins = 2000; }); await click("[data-coinbtn]"); await sleep(500);
const cards = await ev(() => [...document.querySelectorAll("[data-heroes] [data-coinitem]")].map((e) => e.getAttribute("data-coinitem")));
check("la tienda muestra los 6 atuendos de héroe en su sección", JSON.stringify(cards) === JSON.stringify(HEROES.map((h) => h[0])), JSON.stringify(cards));
const prices = await ev(() => [...document.querySelectorAll("[data-heroes] [data-coinitem]")].map((e) => e.textContent.replace(/\s+/g, " ").slice(-14)));
console.log("precios: " + JSON.stringify(prices));
for (const [id] of HEROES) { await click(`[data-heroes] [data-coinitem="${id}"] button`); await sleep(150); }
const st1 = await ev(() => { const c = globalThis.__edisarG.current.cs; return { owned: c.owned, outfit: c.outfit, coins: c.coins }; });
check("se compran con coins (200/200/200/180/240/260 = 1280) y quedan puestos", HEROES.every((h) => st1.owned.includes(h[0])) && st1.outfit === "o_freezer" && st1.coins === 2000 - 1280, JSON.stringify(st1));
await click('[data-heroes] [data-coinitem="o_itachi"] button'); await sleep(250);
check("«Usar» cambia de atuendo (Itachi)", (await ev(() => globalThis.__edisarG.current.cs.outfit)) === "o_itachi");
await ev(() => { const h = [...document.querySelectorAll("[data-coinstore] div")].find((d) => d.textContent === "Atuendos de héroe"); if (h) h.scrollIntoView({ block: "start" }); }); await sleep(300);
await shot("v28-menu.png");
await click("[data-coinbtn]"); await sleep(300);
// en el mundo: el jugador lleva el sprite de héroe (paso + 4 direcciones), y montado también
await put(48, 80); await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; for (const m of g.mons) if (m.alive && Math.abs(m.x - 48) <= 8 && Math.abs(m.y - 80) <= 6) { m.alive = false; m.respawnAt = Infinity; } g.lootToast = null; g.status = ""; }); await sleep(600); const rows = [];
for (const [id, , nm] of HEROES) { await ev((id) => { globalThis.__edisarG.current.cs.outfit = id; }, id); const r = { label: nm, out: [] };
  for (const [f, fl] of FACES) { await ev((f) => { globalThis.__edisarG.current.p.face = f; }, f); await sleep(90); r.out.push({ img: await crop(47.4, 79.25, 2.2, 2), cap: fl }); } rows.push(r); }
await compose(rows, "v28 — atuendos de héroe en el juego (camino al sur de Villa Esmeralda)", "v28-ingame.png");
await ev(() => { const g = globalThis.__edisarG.current; g.cs.outfit = "o_mihawk"; if (g.mt) { if (!g.mt.owned.includes("m_caballo")) g.mt.owned.push("m_caballo"); g.mt.active = "m_caballo"; g.mt.riding = true; } }); await sleep(500);
check("montado también se dibuja el atuendo de héroe (sin errores)", errs.length === 0, errs.slice(0, 2).join(" | "));
await ev(() => { const g = globalThis.__edisarG.current; if (g.mt) g.mt.riding = false; g.cs.outfit = "o_itachi"; }); await sleep(300);
// guardado por personaje y lista de personajes
await page.reload(); await sleep(900);
const li = await ev(() => { const e = document.querySelector("[data-charoutfit]"); return e ? [e.getAttribute("data-charoutfit"), e.textContent] : null; });
check("la lista de personajes muestra su atuendo (retrato + nombre)", !!li && li[0] === "itachi", JSON.stringify(li));
await shot("v28-charlist.png");
await cont(); await sleep(1200);
const st2 = await ev(() => { const c = globalThis.__edisarG.current.cs; return { owned: c.owned.length, outfit: c.outfit }; });
check("al volver a entrar sigue con Itachi y los 6 comprados", st2.outfit === "o_itachi" && st2.owned >= 6, JSON.stringify(st2));
// partidas antiguas: sin «cs», y con atuendos/auras viejos y de Croqui
await page.reload(); await sleep(700); await seed((d) => { delete d.cs; }); await page.reload(); await sleep(600); await cont(); await sleep(1000);
check("partida antigua sin tienda carga (sin atuendo)", (await ev(() => (globalThis.__edisarG.current.cs || { outfit: "" }).outfit)) === "");
await page.reload(); await sleep(700); await seed((d) => { d.cs = { coins: 5, owned: ["o_carmesi", "o_croqui", "a_croqui", "o_raro"], outfit: "o_croqui", aura: "a_croqui", ncol: "" }; }); await page.reload(); await sleep(600); await cont(); await sleep(1000);
const st3 = await ev(() => { const c = globalThis.__edisarG.current.cs; return { owned: c.owned, outfit: c.outfit, aura: c.aura }; });
check("partida v27 con atuendo de Croqui: se conserva (antes se perdía al cargar); ids desconocidos fuera", JSON.stringify(st3.owned) === JSON.stringify(["o_carmesi", "o_croqui", "a_croqui"]) && st3.outfit === "o_croqui" && st3.aura === "a_croqui", JSON.stringify(st3));
check("sin errores en la página", errs.length === 0, errs.slice(0, 3).join(" | "));
console.log(`${res.filter(Boolean).length}/${res.length} v28 checks passed`);
await browser.close(); process.exit(res.every(Boolean) ? 0 : 1);
