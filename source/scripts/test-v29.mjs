// v29: remake de los Caballeros Dorados (etapa 1). Hojas de sprites, técnicas con sus efectos, Shaka abre los ojos, Muro de Cristal,
// Gran Cuerno, Sekishiki, Tenbu Hōrin, Genrō Maō Ken, Otra Dimensión de Saga, botín 1/200 de los atuendos dorados y guardado. Build first: TESTHOOK=1 node scripts/build.mjs
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
const SAINTS = [["mu", "Mu de Aries", 1], ["alde", "Aldebarán de Tauro", 2], ["saga", "Saga de Géminis", 12], ["dm", "Máscara Mortal de Cáncer", 3], ["aioria", "Aioria de Leo", 4], ["shaka", "Shaka de Virgo", 5]];
const ONLY = process.env.ONLY || "";
await newChar("knight", "Seiya", 260, { hp: 1e7 });
const sheets = async (LIST, TAG, TITLE) => {
// ---------- hoja de los 6 santos: sur, este, norte, oeste, paso, ataque, y ojos abiertos / furia ----------
{ const COLS = [[2, 0, 0, 0, "sur"], [1, 0, 0, 0, "este"], [0, 0, 0, 0, "norte"], [3, 0, 0, 0, "oeste"], [2, 1, 0, 0, "paso sur"], [1, 2, 0, 0, "paso este"], [2, 0, 1, 0, "ataque"], [2, 0, 0, 1, "ojos abiertos / Saga malvado"], [2, 0, 0, 2, "furia (<30%)"]];
  const sheet = await ev(([H, C]) => { const S = 4, cw = 58, ch = 66; const o = document.createElement("canvas"); o.width = C.length * cw * S; o.height = H.length * ch * S; const x = o.getContext("2d"); x.imageSmoothingEnabled = false;
    H.forEach((h, r) => C.forEach(([f, ph, cast, alt], k) => { x.save(); x.setTransform(S, 0, 0, S, k * cw * S, r * ch * S); x.fillStyle = (r + k) % 2 ? "#4a4458" : "#403a4e"; x.fillRect(0, 0, cw, ch);
      globalThis.__edisarGs.draw(x, 13, 26, h[0], f, ph, 1000, cast, alt === 1 && h[0] === "shaka", alt === 1 && h[0] === "saga", alt === 2 || (alt === 1 && h[0] === "saga")); x.restore(); }));
    return o.toDataURL().split(",")[1]; }, [LIST, COLS]);
  const p2 = await browser.newPage(); await p2.setViewport({ width: 1240, height: 900 });
  await p2.setContent(`<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:10px 18px">${TITLE}: filas = santo · columnas = ${COLS.map((c) => c[4]).join(" · ")}</h2><div style="display:flex;margin:0 18px"><div>${LIST.map((h) => `<div style="height:${66 * 2.4}px;display:flex;align-items:center;width:170px;font-weight:bold">${h[1]}</div>`).join("")}</div><img src="data:image/png;base64,${sheet}" style="height:${SAINTS.length * 66 * 2.4}px;image-rendering:pixelated"></div></body></html>`);
  if (process.env.RAWSHEET) fs.writeFileSync(process.env.RAWSHEET + `${TAG}-saints.png`, Buffer.from(sheet, "base64"));
  await sleep(300); await p2.screenshot({ path: path.join(G, "shots", `${TAG}-saints.png`), fullPage: true }); await p2.close();
  check("hoja de los 6 santos dorados (4 direcciones + paso + ataque + ojos abiertos/furia)", fs.existsSync(path.join(G, "shots", `${TAG}-saints.png`))); }
// ---------- hoja de los 6 atuendos dorados del jugador (misma rejilla que los atuendos de héroe) ----------
{ const COLS = [[2, 0, "sur"], [1, 0, "este"], [0, 0, "norte"], [3, 0, "oeste"], [2, 1, "paso sur"], [1, 2, "paso este"]];
  const OUT = LIST.map((s) => [`g_${s[0]}`, `Armadura de ${({ mu: "Aries", alde: "Tauro", saga: "Géminis", dm: "Cáncer", aioria: "Leo", shaka: "Virgo", dohko: "Libra", milo: "Escorpio", aioros: "Sagitario", shura: "Capricornio", camus: "Acuario", piscis: "", afro: "Piscis" })[s[0]]}`]);
  const sheet = await ev(([H, C]) => { const S = 6, cw = 40, ch = 46; const o = document.createElement("canvas"); o.width = C.length * cw * S; o.height = H.length * ch * S; const x = o.getContext("2d"); x.imageSmoothingEnabled = false;
    x.fillStyle = "#3a5a2a"; x.fillRect(0, 0, o.width, o.height);
    H.forEach((h, r) => C.forEach(([f, ph], k) => { x.save(); x.setTransform(S, 0, 0, S, k * cw * S, r * ch * S); x.fillStyle = (r + k) % 2 ? "#4a6a36" : "#42622f"; x.fillRect(0, 0, cw, ch); globalThis.__edisarHero(x, 4, 12, h[0], f, ph, 1000); x.restore(); }));
    return o.toDataURL().split(",")[1]; }, [OUT, COLS]);
  const p2 = await browser.newPage(); await p2.setViewport({ width: 1020, height: 900 });
  await p2.setContent(`<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:10px 18px">${TITLE} — atuendos de armadura dorada (botín 1/200): filas = atuendo · columnas = ${COLS.map((c) => c[2]).join(" · ")}</h2><div style="display:flex;margin:0 18px"><div>${OUT.map((h) => `<div style="height:${46 * 3}px;display:flex;align-items:center;width:190px;font-weight:bold">${h[1]}</div>`).join("")}</div><img src="data:image/png;base64,${sheet}" style="height:${OUT.length * 46 * 3}px;image-rendering:pixelated"></div></body></html>`);
  if (process.env.RAWSHEET) fs.writeFileSync(process.env.RAWSHEET + `${TAG}-gold-outfits.png`, Buffer.from(sheet, "base64"));
  await sleep(300); await p2.screenshot({ path: path.join(G, "shots", `${TAG}-gold-outfits.png`), fullPage: true }); await p2.close();
  check("hoja de los 6 atuendos dorados (4 direcciones + paso)", fs.existsSync(path.join(G, "shots", `${TAG}-gold-outfits.png`))); }
};
const SAINTS2 = [["dohko", "Dohko de Libra", 6], ["milo", "Milo de Escorpio", 7], ["aioros", "Aioros de Sagitario", 8], ["shura", "Shura de Capricornio", 9], ["camus", "Camus de Acuario", 10], ["afro", "Afrodita de Piscis", 11]];
if (ONLY !== "sheets2") await sheets(SAINTS, "v29", "Edisar v29 — Caballeros Dorados (etapa 1)");
await sheets(SAINTS2, "v29-1", "Edisar v29.1 — Caballeros Dorados (etapa 2)");
if (ONLY.startsWith("sheets")) { console.log(`${res.filter(Boolean).length}/${res.length}`); await browser.close(); process.exit(0); }

// ---------- en el juego: técnicas de cada guardián ----------
const GS = await ev(() => globalThis.__edisarGs.P);
check("botín de los atuendos dorados: 1/200 por victoria", Math.abs(GS.CLOTH_P - 0.005) < 1e-9, String(GS.CLOTH_P));
const shots = [];
const zone = () => page.evaluate(() => [...document.querySelectorAll("span[title]")].map((s) => s.getAttribute("title")).find((t) => /Casa|Templo|Dimensi|Villa|Santuario|Edisar/.test(t || "")) || "");
const goBoss = (n, dx = -2) => ev(([n, dx]) => { const g = globalThis.__edisarG.current; const now = performance.now();
  for (const m of g.byRegion[n] ?? []) if (m.alive && !m.def.boss) { m.alive = false; m.respawnAt = Infinity; }
  const b = (g.byRegion[n] ?? []).find((m) => m.def.id === `h${n}boss` && m.alive); if (!b) return null;
  b.hp = b.def.hp; b.enraged = false; b.gsb = undefined; b.calmUntil = now + 1e9; b.x = b.sx; b.y = b.sy; b.fx = b.x; b.fy = b.y; b.moveStart = 0; b.face = 3;
  const p = g.p; p.x = b.x + dx; p.y = b.y; p.fx = p.x; p.fy = p.y; p.moveStart = 0; p.hp = 1e7; g.walkGoal = null; g.heldDirs = []; g.warns = []; g.target = -1; g.zone = ""; if (g.gs) { g.gs.fx = []; g.gs.vis = []; g.gs.stun = 0; g.gs.sil = 0; g.gs.conf = 0; }
  return { x: b.x, y: b.y, id: b.id }; }, [n, dx]);
const force = (n, name) => ev(([n, name]) => { const g = globalThis.__edisarG.current; const b = g.byRegion[n].find((m) => m.def.id === `h${n}boss` && m.alive); return globalThis.__edisarGs.force(g, b, name, performance.now()); }, [n, name]);
const boss = (n) => ev((n) => { const g = globalThis.__edisarG.current; const b = g.byRegion[n].find((m) => m.def.id === `h${n}boss` && m.alive); return b ? { x: b.x, y: b.y, hp: b.hp, max: b.def.hp, open: !!(b.gsb && b.gsb.open), wall: b.gsb ? b.gsb.wall : 0 } : null; }, n);
const warnsOf = (name) => ev((name) => globalThis.__edisarG.current.warns.filter((w) => w.name === name).map((w) => w.cells.length), name);
const pl = () => ev(() => { const g = globalThis.__edisarG.current; return { x: g.p.x, y: g.p.y, hp: g.p.hp, gs: g.gs ? { stun: g.gs.stun - performance.now(), sil: g.gs.sil - performance.now(), conf: g.gs.conf - performance.now() } : null }; });
const cropAt = (b, w = 11, h = 9) => crop(b.x - (w - 1) / 2, b.y - (h - 1) / 2 - 0.5, w, h);
// ---------- v29.1 (etapa 2): Dohko, Milo, Aioros, Shura, Camus y Afrodita ----------
{ const shots2 = []; const now = () => ev(() => performance.now());
  const P2 = await ev(() => globalThis.__edisarGs.P2());
  const gs = () => ev(() => { const g = globalThis.__edisarG.current; const t = performance.now(); const s = g.gs || {}; return { needle: s.needle || 0, antAt: s.antAt || 0, root: (s.root || 0) - t, coffin: s.coffin ? s.coffin - t : 0, shred: (s.shred || 0) - t, fields: (s.fields || []).length, slow: g.p.slowUntil - t, poison: g.p.poisonUntil - t, x: g.p.x, y: g.p.y, hp: g.p.hp }; });
  const reset2 = () => ev(() => { const g = globalThis.__edisarG.current; const s = g.gs; if (s) { s.needle = 0; s.antAt = 0; s.root = 0; s.coffin = 0; s.shred = 0; s.fields = []; s.leaps = []; } g.p.slowUntil = 0; g.p.poisonUntil = 0; });
  const go = async (n, dx) => { const b = await goBoss(n, dx); await reset2(); await sleep(150); return b; };
  // Dohko de Libra
  let b = await go(6, -3); await force(6, "Cien Dragones de Rozan (Rozan Hyaku Ryū Ha)"); await sleep(700); const dr = await warnsOf("Cien Dragones de Rozan (Rozan Hyaku Ryū Ha)");
  shots2.push({ label: "Dohko · Cien Dragones de Rozan (aviso)", img: await cropAt(b, 13, 11) }); await sleep(560); shots2.push({ label: "Dohko · Cien Dragones (impacto)", img: await cropAt(b, 13, 11) });
  check("Dohko: Cien Dragones de Rozan = abanico de 7 dragones avisado", dr.length === 1 && dr[0] >= 25, JSON.stringify(dr));
  b = await go(6, -3); await force(6, "Armas de Libra"); await sleep(600); const aw = await warnsOf("Armas de Libra"); shots2.push({ label: "Dohko · Armas de Libra (lanzadas)", img: await cropAt(b) });
  check("Dohko: Armas de Libra = 3 armas giratorias sobre ti y a los lados", aw.length === 1 && aw[0] >= 10, JSON.stringify(aw)); await sleep(700);
  b = await go(6, -2); await force(6, "Escudo de Libra"); await sleep(600);
  const sh = await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[6].find((x) => x.def.id === "h6boss" && x.alive); globalThis.__R = Math.random; Math.random = () => 0.99; const h0 = m.hp; g.projs.push({ sx: g.p.x, sy: g.p.y, ex: m.x, ey: m.y, born: performance.now(), dur: 1, elem: "phys", dmg: 200, target: m.id, leech: 0, slow: 0 }); return { h0, R: 0 }; });
  await sleep(250); await ev(() => { Math.random = globalThis.__R; }); const sh1 = await boss(6);
  shots2.push({ label: "Dohko · Escudo de Libra (½ daño 4 s)", img: await cropAt(b) });
  check("Dohko: Escudo de Libra = recibe la mitad del daño", sh.h0 - sh1.hp === 100, `−${sh.h0 - sh1.hp} de 200`);
  // Milo de Escorpio
  b = await go(7, -2); for (let i = 0; i < 3; i++) { await force(7, "Aguja Escarlata"); await sleep(i === 2 ? 450 : 760); if (i === 2) shots2.push({ label: "Milo · Aguja Escarlata (aviso)", img: await cropAt(b) }); }
  await sleep(350); const n3 = await gs(); shots2.push({ label: "Milo · 3 marcas rojas en ti", img: await cropAt(b) });
  check("Milo: cada Aguja Escarlata suma una marca roja", n3.needle === 3, JSON.stringify(n3.needle));
  await ev(() => { const g = globalThis.__edisarG.current; g.gs.needle = 14; g.gs.needleAt = performance.now(); }); await force(7, "Aguja Escarlata"); await sleep(700);
  const n15 = await gs(); const atk7 = await ev(() => globalThis.__edisarG.current.byRegion[7].find((x) => x.def.id === "h7boss").def.atk); await sleep(500);
  shots2.push({ label: "Milo · ¡Antares! (15.ª aguja)", img: await cropAt(b) }); await sleep(200); const n16 = await gs();
  check("Milo: a las 15 marcas estalla Antares (golpe fuerte) y las marcas vuelven a 0", n15.needle === 0 && n15.antAt > 0 && n15.hp - n16.hp >= Math.round(atk7 * 1.2), `−${Math.round(n15.hp - n16.hp)} (ataque ${atk7})`);
  await ev(() => { const g = globalThis.__edisarG.current; g.gs.needle = 5; g.gs.needleAt = performance.now() - 5100; }); await sleep(300); const nd = await gs();
  check("Milo: las marcas bajan solas si no te dan (tras 5 s, una cada 2,5 s)", nd.needle === 4, String(nd.needle));
  await go(7, -2); await reset2(); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[7].find((x) => x.def.id === "h7boss" && x.alive); m.calmUntil = 0; m.angryUntil = performance.now() + 60000; });
  const seen = new Set(); for (let i = 0; i < 24; i++) { await sleep(250); for (const w of await ev(() => globalThis.__edisarG.current.warns.map((w) => w.name))) seen.add(w); }
  check("Milo usa la Aguja Escarlata solo (IA)", seen.has("Aguja Escarlata"), [...seen].join(", "));
  // Aioros de Sagitario
  b = await go(8, -5); await force(8, "Flecha Dorada"); await sleep(800); const fa = await warnsOf("Flecha Dorada"); shots2.push({ label: "Aioros · Flecha Dorada (aviso)", img: await cropAt(b, 13, 9) });
  await sleep(500); shots2.push({ label: "Aioros · Flecha Dorada (disparo)", img: await cropAt(b, 13, 9) });
  check("Aioros: Flecha Dorada = línea larga avisada 1,2 s", fa.length === 1 && fa[0] >= 6, JSON.stringify(fa));
  b = await go(8, -2); await force(8, "Trueno Atómico"); await sleep(700); const ta = await warnsOf("Trueno Atómico"); shots2.push({ label: "Aioros · Trueno Atómico (aviso)", img: await cropAt(b, 13, 11) });
  await sleep(500); shots2.push({ label: "Aioros · Trueno Atómico (rayos de luz)", img: await cropAt(b, 13, 11) });
  check("Aioros: Trueno Atómico = 3 ráfagas de rayos de luz", ta.length === 3 && ta.every((n) => n >= 15), JSON.stringify(ta));
  // Shura de Capricornio
  b = await go(9, -3); await force(9, "Excalibur"); await sleep(400); const ex = await warnsOf("Excalibur"); shots2.push({ label: "Shura · Excalibur (aviso 0,7 s)", img: await cropAt(b) });
  await sleep(380); shots2.push({ label: "Shura · Excalibur (corte)", img: await cropAt(b) }); const ex2 = await gs();
  check("Shura: Excalibur = corte rápido en línea que te hace sangrar", ex.length === 1 && ex[0] >= 3 && ex2.poison > 1000, `${JSON.stringify(ex)} · sangra ${Math.round(ex2.poison)} ms`);
  b = await go(9, -5); const p0 = await pl(); await force(9, "Salto de la Piedra (Jumping Stone)"); await sleep(650); shots2.push({ label: "Shura · Salto de la Piedra (sombra)", img: await cropAt(b, 13, 9) });
  await sleep(600); const sb = await boss(9); const sp = await pl(); shots2.push({ label: "Shura · Salto de la Piedra (aterriza y empuja)", img: await cropAt(b, 13, 9) });
  check("Shura: Salto de la Piedra = salta hasta ti y te empuja", Math.max(Math.abs(sb.x - p0.x), Math.abs(sb.y - p0.y)) <= 2 && (sb.x !== b.x || sb.y !== b.y) && Math.max(Math.abs(sp.x - sb.x), Math.abs(sp.y - sb.y)) >= 2, `jefe ${b.x},${b.y}→${sb.x},${sb.y}; tú ${p0.x},${p0.y}→${sp.x},${sp.y}`);
  // Camus de Acuario
  b = await go(10, -2); await force(10, "Polvo de Diamante"); await sleep(700); const pd = await warnsOf("Polvo de Diamante"); shots2.push({ label: "Camus · Polvo de Diamante (aviso)", img: await cropAt(b) });
  await sleep(400); const pd2 = await gs(); shots2.push({ label: "Camus · Polvo de Diamante (lento)", img: await cropAt(b) });
  check("Camus: Polvo de Diamante = cono helado que te ralentiza", pd.length === 1 && pd[0] >= 8 && pd2.slow > 2000, `${JSON.stringify(pd)} · lento ${Math.round(pd2.slow)} ms`);
  b = await go(10, -2); await force(10, "Ejecución Aurora"); await sleep(1500); const ea = await warnsOf("Ejecución Aurora"); shots2.push({ label: "Camus · Ejecución Aurora (aviso 2 s)", img: await cropAt(b, 13, 11) });
  await sleep(600); const ea2 = await gs(); shots2.push({ label: "Camus · Ejecución Aurora (congela)", img: await cropAt(b, 13, 11) }); await key("ArrowLeft", 120); const ea3 = await gs();
  check("Camus: Ejecución Aurora = área enorme que te congela 1,5 s (no te mueves)", ea.length === 1 && ea[0] >= 40 && ea2.root > 800 && ea3.x === ea2.x, `${JSON.stringify(ea)} · congelado ${Math.round(ea2.root)} ms`);
  await sleep(1200); b = await go(10, -3); await force(10, "Ataúd de Hielo"); await sleep(1100); const cf = await gs(); shots2.push({ label: "Camus · Ataúd de Hielo (encerrado)", img: await cropAt(b) });
  const t0 = await now(); for (let i = 0; i < 6 && (await gs()).coffin > 0; i++) await key("ArrowLeft", 60); const t1 = await now(); const cf2 = await gs();
  check("Camus: Ataúd de Hielo te encierra ~2 s y forcejeando se rompe antes", cf.coffin > 1500 && cf2.coffin <= 0 && t1 - t0 < cf.coffin, `quedaban ${Math.round(cf.coffin)} ms; roto en ${Math.round(t1 - t0)} ms`);
  // Afrodita de Piscis
  b = await go(11, -3); await force(11, "Rosas Diabólicas Reales"); await sleep(1300); const rf = await gs(); shots2.push({ label: "Afrodita · Rosas Diabólicas Reales (jardín)", img: await cropAt(b) });
  check("Afrodita: Rosas Diabólicas Reales = jardín que envenena mientras lo pisas", rf.fields === 1 && rf.poison > 1000, `campos ${rf.fields} · veneno ${Math.round(rf.poison)} ms`);
  b = await go(11, -2); await force(11, "Rosas Piraña"); await sleep(500); const rp = await warnsOf("Rosas Piraña"); shots2.push({ label: "Afrodita · Rosas Piraña (aviso)", img: await cropAt(b) });
  await sleep(500); const rp2 = await gs(); shots2.push({ label: "Afrodita · Rosas Piraña (armadura rota)", img: await cropAt(b) });
  check("Afrodita: Rosas Piraña = rosas negras en abanico que rompen la armadura (+20% daño 5 s)", rp.length === 1 && rp[0] >= 10 && rp2.shred > 3500, `${JSON.stringify(rp)} · ${Math.round(rp2.shred)} ms`);
  b = await go(11, -3); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[11].find((x) => x.def.id === "h11boss" && x.alive); m.hp = Math.round(m.def.hp * 0.5); });
  const a0 = (await boss(11)).hp; await force(11, "Rosa Sangrienta"); await sleep(700); shots2.push({ label: "Afrodita · Rosa Sangrienta (rosa blanca)", img: await cropAt(b) }); await sleep(500); const a1 = (await boss(11)).hp;
  check("Afrodita: Rosa Sangrienta (rosa blanca) te roba vida", a1 > a0, `${a0} → ${a1}`);
  await reset2();
  { const p2 = await browser.newPage(); await p2.setViewport({ width: 1300, height: 900 });
    await p2.setContent(`<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:10px 18px">Edisar v29.1 — técnicas de los Caballeros Dorados, etapa 2 (casillas rojas = aviso; luego el efecto)</h2><div style="display:flex;flex-wrap:wrap;margin:0 12px">${shots2.map((s) => `<div style="margin:6px;text-align:center"><img src="data:image/png;base64,${s.img}" style="height:190px;border:1px solid #5a4a3a"><div style="font-size:12px;font-weight:bold">${s.label}</div></div>`).join("")}</div></body></html>`);
    await sleep(300); await p2.screenshot({ path: path.join(G, "shots", "v29-1-techniques.png"), fullPage: true }); await p2.close();
    check("lámina de técnicas de la etapa 2", fs.existsSync(path.join(G, "shots", "v29-1-techniques.png")), `${shots2.length} capturas`); }
}
if (ONLY === "s2") { console.log(`${res.filter(Boolean).length}/${res.length}`); await browser.close(); process.exit(res.every(Boolean) ? 0 : 1); }
// Mu de Aries
let b = await goBoss(1); await sleep(400); await force(1, "Muro de Cristal"); await sleep(800);
const hpMu = (await boss(1)).hp, hpP = (await pl()).hp;
await ev(() => { const g = globalThis.__edisarG.current; const b = g.byRegion[1].find((m) => m.def.id === "h1boss" && m.alive); g.projs.push({ sx: g.p.x, sy: g.p.y, ex: b.x, ey: b.y, born: performance.now(), dur: 1, elem: "phys", dmg: 200, target: b.id, leech: 0, slow: 0 }); }); await sleep(250);
const muA = await boss(1), pA = await pl();
shots.push({ label: "Mu · Muro de Cristal", img: await cropAt(b) });
check("Mu: el Muro de Cristal bloquea el proyectil y te devuelve el 35% (70)", muA.hp === hpMu && hpP - pA.hp >= 60, `Mu ${hpMu}→${muA.hp}, tú −${Math.round(hpP - pA.hp)}`);
b = await goBoss(1); await force(1, "Extinción de Luz Estelar"); await sleep(1300); const se = await warnsOf("Extinción de Luz Estelar");
shots.push({ label: "Mu · Extinción de Luz Estelar (aviso 2 s)", img: await cropAt(b, 13, 11) }); await sleep(780); shots.push({ label: "Mu · Extinción de Luz Estelar (impacto)", img: await cropAt(b, 13, 11) });
check("Mu: Extinción de Luz Estelar avisa un área enorme (radio 4)", se.length === 1 && se[0] >= 30, JSON.stringify(se));
// Aldebarán de Tauro
b = await goBoss(2, -1); await force(2, "Gran Cuerno"); await sleep(750); const gc = await warnsOf("Gran Cuerno"); shots.push({ label: "Aldebarán · Gran Cuerno (aviso)", img: await cropAt(b) });
await sleep(480); shots.push({ label: "Aldebarán · Gran Cuerno (impacto + empujón)", img: await cropAt(b) }); await sleep(300); const pK = await pl();
check("Aldebarán: Gran Cuerno = cono frontal avisado que te lanza lejos", gc.length === 1 && gc[0] >= 8 && Math.max(Math.abs(pK.x - b.x), Math.abs(pK.y - b.y)) >= 3, `cono ${gc[0]} casillas, ahora a ${Math.max(Math.abs(pK.x - b.x), Math.abs(pK.y - b.y))} casillas`);
// Máscara Mortal de Cáncer
b = await goBoss(3); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[3].find((x) => x.def.id === "h3boss" && x.alive); m.hp = Math.round(m.def.hp * 0.5); });
const dm0 = (await boss(3)).hp; await force(3, "Sekishiki Meikai Ha"); await sleep(800); shots.push({ label: "Máscara Mortal · Sekishiki Meikai Ha (almas)", img: await cropAt(b) }); await sleep(650);
const dm1 = (await boss(3)).hp; shots.push({ label: "Máscara Mortal · roba la vida", img: await cropAt(b) });
check("Máscara Mortal: Sekishiki Meikai Ha le cura con tu vida", dm1 > dm0, `${dm0} → ${dm1}`);
// Aioria de Leo
b = await goBoss(4); await force(4, "Plasma Relámpago"); await sleep(650); const lp = await warnsOf("Plasma Relámpago"); shots.push({ label: "Aioria · Plasma Relámpago (aviso)", img: await cropAt(b, 13, 11) });
await sleep(330); shots.push({ label: "Aioria · Plasma Relámpago (rayos)", img: await cropAt(b, 13, 11) });
check("Aioria: Plasma Relámpago = 2 oleadas de rayos en 16 direcciones", lp.length === 2 && lp.every((n) => n >= 20), JSON.stringify(lp));
await sleep(1200); b = await goBoss(4, -3); await force(4, "Relámpago de Voltaje"); await sleep(500); const lb = await warnsOf("Relámpago de Voltaje"); shots.push({ label: "Aioria · Relámpago de Voltaje (aviso)", img: await cropAt(b) });
await sleep(380); shots.push({ label: "Aioria · Relámpago de Voltaje (impacto)", img: await cropAt(b) });
check("Aioria: Relámpago de Voltaje = un solo golpe fuerte sobre tu casilla", lb.length === 1 && lb[0] === 1);
// natural: Aioria pelea solo unos segundos y usa sus técnicas
await goBoss(4, -2); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[4].find((x) => x.def.id === "h4boss" && x.alive); m.calmUntil = 0; m.angryUntil = performance.now() + 60000; });
const seen = new Set(); for (let i = 0; i < 40; i++) { await sleep(250); for (const w of await ev(() => globalThis.__edisarG.current.warns.map((w) => w.name))) seen.add(w); }
check("Aioria usa sus técnicas solo (IA)", seen.has("Plasma Relámpago") || seen.has("Relámpago de Voltaje"), [...seen].join(", "));
// Shaka de Virgo
b = await goBoss(5, -1); const sh0 = await boss(5);
await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[5].find((x) => x.def.id === "h5boss" && x.alive); m.hp = Math.round(m.def.hp * 0.49); m.calmUntil = 0; m.angryUntil = performance.now() + 60000; }); await sleep(500);
const sh1 = await boss(5); shots.push({ label: "Shaka · ¡abre los ojos! (50%)", img: await cropAt(b) });
check("Shaka: ojos cerrados hasta el 50% y luego los abre", !sh0.open && sh1.open);
await goBoss(5, -1); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[5].find((x) => x.def.id === "h5boss" && x.alive); m.gsb = { cd: {}, next: 0, cast: 0, open: true, wall: 0, wallFrom: 0 }; m.hp = Math.round(m.def.hp * 0.45); });
await force(5, "Tesoro del Cielo (Tenbu Hōrin)"); await sleep(1000); shots.push({ label: "Shaka · Tenbu Hōrin (aviso)", img: await cropAt(b) }); await sleep(600);
const tb = await pl(); const cp = await ev(() => globalThis.__edisarGs.cast(globalThis.__edisarG.current, 0, performance.now()));
check("Shaka: Tenbu Hōrin te aturde y te deja sin poderes 4 s", tb.gs && tb.gs.sil > 2500 && tb.gs.stun > 0 && cp === false, JSON.stringify(tb.gs));
await sleep(3500); await goBoss(5, -2); await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[5].find((x) => x.def.id === "h5boss" && x.alive); m.gsb = { cd: {}, next: 0, cast: 0, open: true, wall: 0, wallFrom: 0 }; m.hp = Math.round(m.def.hp * 0.45); });
await force(5, "Rendición Divina (Ten Ma Kō Fuku)"); await sleep(1100); const tm = await warnsOf("Rendición Divina (Ten Ma Kō Fuku)"); shots.push({ label: "Shaka · Ten Ma Kō Fuku (aviso)", img: await cropAt(b, 13, 11) });
await sleep(600); shots.push({ label: "Shaka · Ten Ma Kō Fuku (impacto)", img: await cropAt(b, 13, 11) });
check("Shaka: Ten Ma Kō Fuku con los ojos abiertos cubre un área más grande", tm.length === 1 && tm[0] >= 40, JSON.stringify(tm));
// Saga de Géminis
b = await goBoss(12); await force(12, "Explosión de Galaxias"); await sleep(1500); const ge = await warnsOf("Explosión de Galaxias"); shots.push({ label: "Saga · Explosión de Galaxias (aviso 2,2 s)", img: await cropAt(b, 13, 11) });
await sleep(780); shots.push({ label: "Saga · Explosión de Galaxias (estallido)", img: await cropAt(b, 13, 11) });
check("Saga: Explosión de Galaxias enorme (radio ~4,5) y avisada 2,2 s", ge.length === 1 && ge[0] >= 45, JSON.stringify(ge));
await sleep(500); b = await goBoss(12); await force(12, "Satán Imperial (Genrō Maō Ken)"); await sleep(500); shots.push({ label: "Saga · Genrō Maō Ken (puño)", img: await cropAt(b) }); await sleep(700);
const cf = await pl(); await key("ArrowLeft", 120); await sleep(300); const cf2 = await pl();
check("Saga: Genrō Maō Ken invierte los controles 3 s (← te mueve a la derecha)", cf.gs && cf.gs.conf > 2000 && cf2.x === cf.x + 1, `conf ${cf.gs && Math.round(cf.gs.conf)} ms, x ${cf.x}→${cf2.x}`);
await sleep(2500); b = await goBoss(12); await force(12, "Otra Dimensión"); await sleep(900); shots.push({ label: "Saga · Otra Dimensión (remolino)", img: await cropAt(b) }); await sleep(800);
const dz = await zone(); const dd = await ev(() => { const d = globalThis.__edisarG.current.dim; return d ? d.until - d.start : 0; });
check("Saga: Otra Dimensión propia te manda al vacío 12 s", /Otra Dimensi/.test(dz) && Math.abs(dd - 12000) < 50, `${dz} · ${dd} ms`);
await ev(() => { const g = globalThis.__edisarG.current; if (g.dim) g.dim.until = performance.now(); }); await sleep(600);
check("vuelves a la Casa de Géminis", !(await zone()).includes("Otra Dimensi"), await zone());
// lámina de técnicas
{ const p2 = await browser.newPage(); await p2.setViewport({ width: 1300, height: 900 });
  await p2.setContent(`<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:10px 18px">Edisar v29 — técnicas de los Caballeros Dorados (casillas rojas = aviso; luego el efecto)</h2><div style="display:flex;flex-wrap:wrap;margin:0 12px">${shots.map((s) => `<div style="margin:6px;text-align:center"><img src="data:image/png;base64,${s.img}" style="width:300px;border:1px solid #5a4a3a"><div style="font-size:12px;font-weight:bold">${s.label}</div></div>`).join("")}</div></body></html>`);
  await sleep(300); await p2.screenshot({ path: path.join(G, "shots", "v29-techniques.png"), fullPage: true }); await p2.close();
  check("lámina de técnicas en acción", fs.existsSync(path.join(G, "shots", "v29-techniques.png")), `${shots.length} capturas`); }
// ---------- botín: atuendo cosmético 1/200, no se vende, se guarda por personaje ----------
await click("[data-coinbtn]"); await sleep(400);
const gc0 = await ev(() => [...document.querySelectorAll("[data-goldcloth] [data-coinitem]")].map((e) => [e.getAttribute("data-coinitem"), !!e.querySelector("button"), e.textContent.includes("Botín de")]));
const hc = await ev(() => document.querySelectorAll("[data-heroes] [data-coinitem]").length);
check("tienda: sección «Armaduras doradas» con 12 atuendos que no se venden (sin botón de compra)", gc0.length === 12 && gc0.every((r) => !r[1] && r[2]) && hc === 19, JSON.stringify(gc0) + ` héroes=${hc}`);
await click("[data-coinbtn]"); await sleep(200);
const dr = await ev(() => { const g = globalThis.__edisarG.current; const now = performance.now(); const R = Math.random; const by = (n) => g.byRegion[n].find((m) => m.def.id === `h${n}boss`); const out = [];
  Math.random = () => 0.0051; out.push(globalThis.__edisarGs.drop(g, by(1), now)); Math.random = () => 0.0049; out.push(globalThis.__edisarGs.drop(g, by(1), now)); out.push(globalThis.__edisarGs.drop(g, by(1), now)); Math.random = R;
  const k = by(2); k.gm = true; out.push(globalThis.__edisarGs.drop(g, k, now, true)); k.gm = false;
  for (const n of [2, 3, 4, 5, 12, 6, 7, 8, 9, 10, 11]) out.push(globalThis.__edisarGs.drop(g, by(n), now, true)); return { out, owned: g.cs.owned.filter((id) => id.startsWith("o_g_")) }; });
check("botín: 0.0051 no suelta, 0.0049 sí (1/200); una sola vez; invocados por GM no sueltan", JSON.stringify(dr.out) === JSON.stringify([false, true, false, false, true, true, true, true, true, true, true, true, true, true, true]) && dr.owned.length === 12, JSON.stringify(dr));
await click("[data-coinbtn]"); await sleep(400); await click('[data-goldcloth] [data-coinitem="o_g_virgo"] button'); await sleep(250);
check("«Usar» se pone la Armadura de Virgo", (await ev(() => globalThis.__edisarG.current.cs.outfit)) === "o_g_virgo");
await click("[data-coinbtn]"); await sleep(200);
await page.reload(); await sleep(900);
const li = await ev(() => { const e = document.querySelector("[data-charoutfit]"); return e ? e.getAttribute("data-charoutfit") : null; });
check("la lista de personajes muestra el atuendo dorado", li === "g_shaka", String(li));
await cont(); await sleep(1100);
check("al volver a entrar conserva los 12 atuendos dorados y la de Virgo puesta", await ev(() => { const c = globalThis.__edisarG.current.cs; return c.outfit === "o_g_virgo" && c.owned.filter((i) => i.startsWith("o_g_")).length === 12; }));
check("GM: «/gm armaduras» da los 12 (función del panel GM)", (await ev(() => { const g = globalThis.__edisarG.current; g.cs.owned = g.cs.owned.filter((i) => !i.startsWith("o_g_")); return globalThis.__edisarGs.grant(g); })).includes("12 atuendos"));
// curva y topes de botín de los guardianes sin cambios
const lv = await ev(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => { const g = globalThis.__edisarG.current; const m = g.byRegion[n].find((x) => x.def.id === `h${n}boss`); return [m.def.lootLvl, m.def.hp, m.def.atk]; }));
console.log("guardianes [lootLvl, vida, ataque]: " + JSON.stringify(lv));
check("topes de botín iguales (casa +6; Géminis +12)", JSON.stringify(lv.map((x) => x[0])) === JSON.stringify([9, 13, 17, 21, 26, 31, 36, 41, 46, 52, 58, 72]));
// partida antigua con atuendos dorados y desconocidos
await page.reload(); await sleep(700); await seed((d) => { d.cs = { coins: 5, owned: ["o_g_leo", "o_raro", "o_croqui", "o_g_piscis"], outfit: "o_g_piscis", aura: "", ncol: "" }; }); await page.reload(); await sleep(600); await cont(); await sleep(900);
check("partida guardada con atuendo dorado: se conserva; ids desconocidos fuera", await ev(() => { const c = globalThis.__edisarG.current.cs; return JSON.stringify(c.owned) === JSON.stringify(["o_g_leo", "o_croqui", "o_g_piscis"]) && c.outfit === "o_g_piscis"; }));
check("sin errores en la página", errs.length === 0, errs.slice(0, 3).join(" | "));
console.log(`${res.filter(Boolean).length}/${res.length} v29 checks passed`);
await browser.close(); process.exit(res.every(Boolean) ? 0 : 1);
